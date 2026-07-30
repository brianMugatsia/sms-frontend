package com.anonymous.smsDashboard

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import org.json.JSONArray

class SettingsBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val PREFS_NAME = "forwarding_prefs"
    }

    override fun getName() = "SettingsBridge"

    @ReactMethod
    fun syncSettings(
        enabled: Boolean,
        forwardAll: Boolean,
        keywords: ReadableArray,
        promise: Promise
    ) {
        try {
            val prefs = reactApplicationContext
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val keywordList = (0 until keywords.size()).map { keywords.getString(it) }
            val keywordsJson = JSONArray(keywordList).toString()

            prefs.edit()
                .putBoolean("enabled", enabled)
                .putBoolean("forwardAll", forwardAll)
                .putString("keywords", keywordsJson)
                .apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun setApiBaseUrl(
        baseUrl: String,
        promise: Promise
    ) {
        try {
            val prefs = reactApplicationContext
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            prefs.edit()
                .putString("api_base_url", baseUrl)
                .apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_URL_FAILED", e.message, e)
        }
    }
}