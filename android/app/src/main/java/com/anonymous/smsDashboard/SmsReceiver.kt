package com.anonymous.smsDashboard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.WorkManager
import org.json.JSONArray
import java.util.UUID
import java.util.concurrent.TimeUnit

class SmsReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "SmsReceiver"
        private const val PREFS_NAME = "forwarding_prefs"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "onReceive triggered, action=${intent.action}")

        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) {
            Log.d(TAG, "No messages found in intent")
            return
        }

        val sender = messages[0].originatingAddress ?: "unknown"
        val timestamp = messages[0].timestampMillis
        val body = messages.joinToString(separator = "") { it.messageBody ?: "" }
        val smsId = UUID.randomUUID().toString()

        Log.d(TAG, "SMS received from=$sender bodyLength=${body.length} id=$smsId")

        // --- Filtering logic (ported from JS shouldForward()) ---
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val enabled = prefs.getBoolean("enabled", true)
        val forwardAll = prefs.getBoolean("forwardAll", true)

        if (!enabled) {
            Log.d(TAG, "Forwarding disabled, skipping sender=$sender")
            return
        }

        if (!forwardAll) {
            val keywordsJson = prefs.getString("keywords", "[]") ?: "[]"
            val keywordsArr = JSONArray(keywordsJson)
            val keywords = (0 until keywordsArr.length()).map { keywordsArr.getString(it) }

            if (keywords.isEmpty()) {
                Log.d(TAG, "No keywords configured, skipping sender=$sender")
                return
            }

            val contactName = ContactResolver.getContactName(context, sender)
            val nameToCheck = (contactName ?: sender).trim().lowercase()

            val matches = keywords.any { it.trim().lowercase() == nameToCheck }
            if (!matches) {
                Log.d(TAG, "Sender '$sender' (resolved: '$nameToCheck') did not match keywords, skipping")
                return
            }
        }
        // --- end filtering ---

        val inputData = Data.Builder()
            .putString("smsId", smsId)
            .putString("sender", sender)
            .putString("body", body)
            .putLong("timestamp", timestamp)
            .build()

        // UPDATE: Make the work request EXPEDITED so it runs instantly,
        // and set a backoff retry policy if the network fails.
        val workRequest = OneTimeWorkRequestBuilder<SmsForwardWorker>()
            .setInputData(inputData)
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .setBackoffCriteria(
                BackoffPolicy.LINEAR,
                10,
                TimeUnit.SECONDS
            )
            .build()

        WorkManager.getInstance(context).enqueue(workRequest)
        Log.d(TAG, "WorkManager job enqueued: ${workRequest.id}")
    }
}