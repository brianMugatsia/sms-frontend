package com.anonymous.smsDashboard

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract

object ContactResolver {
    fun getContactName(context: Context, phoneNumber: String): String? {
        val uri = Uri.withAppendedPath(
            ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
            Uri.encode(phoneNumber)
        )
        val projection = arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME)

        var cursor: Cursor? = null
        try {
            cursor = context.contentResolver.query(uri, projection, null, null, null)
            if (cursor != null && cursor.moveToFirst()) {
                val idx = cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                if (idx >= 0) return cursor.getString(idx)
            }
        } catch (e: SecurityException) {
            // READ_CONTACTS permission not granted at runtime — fall back to raw sender
            return null
        } finally {
            cursor?.close()
        }
        return null
    }
}