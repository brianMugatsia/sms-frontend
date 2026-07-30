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
        private const val PREFS_NAME = "forwarding_prefs"
        private const val DEFAULT_BASE_URL = "https://smsapi.roberms.com"
    }

    override suspend fun doWork(): Result {
        val sender = inputData.getString("sender") ?: return Result.failure()
        val message = inputData.getString("body") ?: ""
        val receivedAt = inputData.getLong("timestamp", 0)

        val deviceId = Secure.getString(appContext.contentResolver, Secure.ANDROID_ID) ?: "unknown-device"
        val smsId = inputData.getString("smsId") ?: UUID.randomUUID().toString()

        // Read the current backend URL from SharedPreferences, which is kept
        // up to date by configService.ts via SettingsBridgeModule.setApiBaseUrl().
        // Falls back to DEFAULT_BASE_URL if the app hasn't synced one yet
        // (e.g. very first install before the app has opened even once).
        val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val baseUrl = prefs.getString("api_base_url", DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL

        Log.d(TAG, "doWork started, attempt=$runAttemptCount sender=$sender device=$deviceId id=$smsId baseUrl=$baseUrl")

        return try {
            val url = URL("$baseUrl/api/sms/forward")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true

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