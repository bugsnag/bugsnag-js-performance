package com.bugsnag.test.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.bugsnag.android.performance.AutoInstrument;
import com.bugsnag.android.performance.BugsnagPerformance;
import com.bugsnag.android.performance.PerformanceConfiguration;

import com.bugsnag.reactnative.performance.ReactNativeAppStartPlugin;
import com.bugsnag.reactnative.performance.nativespans.BugsnagJavascriptSpansPlugin;
import com.bugsnag.reactnative.performance.nativespans.BugsnagNativeSpansPlugin;

import java.util.HashMap;
import java.util.Map;

/**
 * Native test utilities for React Native Performance test fixtures
 */
public class BugsnagTestUtils {

    private static final String TAG = "BugsnagTestUtils";
    private static final String PREFS_NAME = "StartupConfig";

    /**
     * Reads the startup configuration that was previously saved by the ScenarioLauncher.
     * 
     * @param context Application context
     * @return Map containing the startup configuration, or null if no configuration is saved
     */
    public static Map<String, Object> readStartupConfig(Context context) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        if (!sharedPreferences.getBoolean("configured", false)) {
            Log.d(TAG, "No startup configuration found");
            return null;
        }

        Map<String, Object> startupConfig = new HashMap<>();
        startupConfig.put("apiKey", sharedPreferences.getString("apiKey", ""));
        startupConfig.put("endpoint", sharedPreferences.getString("endpoint", ""));
        startupConfig.put("autoInstrumentAppStarts", sharedPreferences.getBoolean("autoInstrumentAppStarts", false));
        startupConfig.put("autoInstrumentNetworkRequests", sharedPreferences.getBoolean("autoInstrumentNetworkRequests", false));
        startupConfig.put("maximumBatchSize", sharedPreferences.getInt("maximumBatchSize", 100));
        startupConfig.put("useWrapperComponentProvider", sharedPreferences.getBoolean("useWrapperComponentProvider", false));
        startupConfig.put("scenario", sharedPreferences.getString("scenario", ""));

        Log.d(TAG, "Read startup configuration: " + startupConfig);
        
        return startupConfig;
    }

    /**
     * Saves the startup configuration to shared preferences for use by native startup.
     * 
     * @param context Application context
     * @param configuration Configuration map containing performance settings
     */
    public static void saveStartupConfig(Context context, Map<String, Object> configuration) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putBoolean("configured", true);

        if (configuration.containsKey("apiKey")) {
            Object value = configuration.get("apiKey");
            if (value instanceof String) {
                editor.putString("apiKey", (String) value);
            }
        }

        if (configuration.containsKey("endpoint")) {
            Object value = configuration.get("endpoint");
            if (value instanceof String) {
                editor.putString("endpoint", (String) value);
            }
        }

        if (configuration.containsKey("autoInstrumentAppStarts")) {
            Boolean value = getBooleanValue(configuration, "autoInstrumentAppStarts", false);
            editor.putBoolean("autoInstrumentAppStarts", value);
        }

        if (configuration.containsKey("autoInstrumentNetworkRequests")) {
            Boolean value = getBooleanValue(configuration, "autoInstrumentNetworkRequests", false);
            editor.putBoolean("autoInstrumentNetworkRequests", value);
        }

        if (configuration.containsKey("maximumBatchSize")) {
            Integer value = getIntegerValue(configuration, "maximumBatchSize", 100);
            editor.putInt("maximumBatchSize", value);
        }

        if (configuration.containsKey("useWrapperComponentProvider")) {
            Boolean value = getBooleanValue(configuration, "useWrapperComponentProvider", false);
            editor.putBoolean("useWrapperComponentProvider", value);
        }

        if (configuration.containsKey("scenario")) {
            Object value = configuration.get("scenario");
            if (value instanceof String) {
                editor.putString("scenario", (String) value);
            }
        }

        editor.commit();
    }

    /**
     * Starts the native Bugsnag Performance SDK with the provided configuration.
     * 
     * @param context Application context
     * @param configuration Configuration map containing performance settings
     * @return true if started successfully, false otherwise
     */
    public static boolean startNativePerformance(Context context, Map<String, Object> configuration) {
        try {
            Log.d(TAG, "Starting native performance with configuration: " + configuration);
            
            PerformanceConfiguration config = PerformanceConfiguration.load(context);

            String apiKey = (String)configuration.get("apiKey");
            String endpoint = (String)configuration.get("endpoint");
            
            config.setApiKey(apiKey);
            config.setEndpoint(endpoint);
            config.setAutoInstrumentAppStarts(false);
            config.setAutoInstrumentActivities(AutoInstrument.OFF);
            config.setAutoInstrumentRendering(true);
            config.addPlugin(new BugsnagNativeSpansPlugin());
            config.addPlugin(new BugsnagJavascriptSpansPlugin());

            BugsnagPerformance.start(config);
            Log.d(TAG, "Native performance started successfully");
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to start native performance", e);
            return false;
        }
    }

    public static void clearStartupConfig(Context context) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putBoolean("configured", false)
              .remove("apiKey")
              .remove("endpoint")
              .remove("autoInstrumentAppStarts")
              .remove("autoInstrumentNetworkRequests")
              .remove("maximumBatchSize")
              .remove("useWrapperComponentProvider")
              .remove("scenario")
              .remove("attach")
              .commit();
    }

    private static Boolean getBooleanValue(Map<String, Object> config, String key, Boolean defaultValue) {
        Object value = config.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return defaultValue;
    }

    private static Integer getIntegerValue(Map<String, Object> config, String key, Integer defaultValue) {
        Object value = config.get(key);
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
}