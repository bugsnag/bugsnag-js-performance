package com.bugsnag.test.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

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

    public static void startNativePerformanceIfConfigured(Context context) {
        Map<String, Object> config = readStartupConfig(context);
        if (config == null) {
            Log.d(TAG, "No startup configuration found, skipping native performance start");
            return;
        }

        Object nativeConfigObj = config.get("native");
        if (!(nativeConfigObj instanceof Map)) {
            Log.d(TAG, "No native configuration found, skipping native performance start");
            return;
        }

        Map<String, Object> nativeConfig = (Map<String, Object>) nativeConfigObj;
        startNativePerformance(context, nativeConfig);
    }

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

        String configJson = sharedPreferences.getString("startupConfig", null);
        if (configJson == null) {
            Log.d(TAG, "Configuration flag set but no configuration JSON found");
            return null;
        }

        try {
            JSONObject configObject = new JSONObject(configJson);
            Map<String, Object> configMap = convertJSONObjectToMap(configObject);
            Log.d(TAG, "Read startup configuration: " + configMap);
            return configMap;
        } catch (JSONException e) {
            Log.e(TAG, "Error converting JSON to map", e);
            return null;
        }
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
        
        try {
            JSONObject configJsonObject = new JSONObject(configuration);
            String jsonString = configJsonObject.toString();

            editor.putBoolean("configured", true);
            editor.putString("startupConfig", jsonString);
            editor.commit();
    
            Log.d(TAG, "Saved startup configuration: " + jsonString);
        }
        catch (Exception e) {
            Log.e(TAG, "Error during saving startup configuration", e);
        }
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
            boolean autoInstrumentAppStarts = Boolean.TRUE.equals(configuration.get("autoInstrumentAppStarts"));
            boolean autoInstrumentViewLoads = Boolean.TRUE.equals(configuration.get("autoInstrumentViewLoads"));
            config.setApiKey(apiKey);
            config.setEndpoint(endpoint);
            config.setAutoInstrumentAppStarts(autoInstrumentAppStarts);
            config.setAutoInstrumentActivities(autoInstrumentViewLoads ? AutoInstrument.FULL : AutoInstrument.OFF);
            config.setAutoInstrumentRendering(true);
            config.addPlugin(new BugsnagNativeSpansPlugin());
            config.addPlugin(new BugsnagJavascriptSpansPlugin());
            config.addPlugin(new ReactNativeAppStartPlugin());

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
              .remove("startupConfig")
              .commit();
    }

    /**
     * Recursively converts a JSONObject to a Map, handling nested JSONObjects properly.
     */
    private static Map<String, Object> convertJSONObjectToMap(JSONObject jsonObject) throws JSONException {
        Map<String, Object> map = new HashMap<>();
        
        Iterator<String> keys = jsonObject.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            Object value = jsonObject.get(key);
            
            // Handle nested JSONObjects by converting them to Maps
            if (value instanceof JSONObject) {
                value = convertJSONObjectToMap((JSONObject) value);
            }
            
            map.put(key, value);
        }
        
        return map;
    }
}