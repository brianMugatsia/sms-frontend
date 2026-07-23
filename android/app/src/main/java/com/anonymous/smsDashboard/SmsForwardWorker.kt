package com.anonymous.smsDashboard

import android.content.Context
import android.provider.Settings.Secure
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import org.json.JSONObject

class SmsForwardWorker(private val appContext: Context, params: WorkerParameters) :
    CoroutineWorker(appContext, params) {

    companion object {
        private const val TAG = "SmsForwardWorker"
    }

    override suspend fun doWork(): Result {
        val sender = inputData.getString("sender") ?: return Result.failure()
        val message = inputData.getString("body") ?: ""
        val receivedAt = inputData.getLong("timestamp", 0)

        val deviceId = Secure.getString(appContext.contentResolver, Secure.ANDROID_ID) ?: "unknown-device"
        val smsId = inputData.getString("smsId") ?: UUID.randomUUID().toString()

        Log.d(TAG, "doWork started, attempt=$runAttemptCount sender=$sender device=$deviceId id=$smsId")

        return try {
            val url = URL("https://sms-backend-w6d5.onrender.com/api/sms/forward")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true

            // UPDATE: Increased from 15000 to 60000 ms to handle Render free tier cold starts
            conn.connectTimeout = 60000
            conn.readTimeout = 60000

            val payload = JSONObject().apply {
                put("id", smsId)
                put("sender", sender)
                put("message", message)
                put("device_id", deviceId)
                put("received_at", receivedAt)
            }

            conn.outputStream.use { it.write(payload.toString().toByteArray()) }

            val code = conn.responseCode
            Log.d(TAG, "Backend responded with code=$code")

            when (code) {
                in 200..299 -> {
                    Log.d(TAG, "Forward succeeded")
                    Result.success()
                }
                in 500..599 -> {
                    Log.d(TAG, "Server error, will retry")
                    Result.retry()
                }
                else -> {
                    Log.d(TAG, "Client error ($code), not retrying")
                    Result.failure()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during forward: ${e.message}", e)
            Result.retry()
        }
    }
}