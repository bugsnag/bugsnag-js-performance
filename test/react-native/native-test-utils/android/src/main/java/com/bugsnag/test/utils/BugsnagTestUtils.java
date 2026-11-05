package com.bugsnag.test.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.bugsnag.android.performance.AutoInstrument;
import com.bugsnag.android.performance.BugsnagPerformance;
import com.bugsnag.android.performance.EnabledMetrics;
import com.bugsnag.android.performance.PerformanceConfiguration;

import com.bugsnag.reactnative.performance.nativespans.BugsnagJavascriptSpansPlugin;
import com.bugsnag.reactnative.performance.nativespans.BugsnagNativeSpansPlugin;
import com.bugsnag.reactnative.performance.nativespans.BugsnagReactNativeAppStartPlugin;

/**
 * Native test utilities for React Native Performance test fixtures
 */
public class BugsnagTestUtils {

    private static final String TAG = "BugsnagTestUtils";
    private static final String PREFS_NAME = "StartupConfig";

    public static void startNativePerformanceIfConfigured(Context context) {
        if (context == null) {
            Log.d(TAG, "Context is null, skipping native performance start");
            return;
        }

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

        @SuppressWarnings("unchecked")
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
        if (context == null) {
            return null;
        }

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
        if (context == null || configuration == null) {
            return;
        }

        SharedPreferences sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        
        try {
            Object wrapped = wrapJson(configuration);
            String jsonString = wrapped != null ? wrapped.toString() : "{}";

            editor.putBoolean("configured", true);
            editor.putString("startupConfig", jsonString);
            editor.commit();
    
            Log.d(TAG, "Saved startup configuration: " + jsonString);
        } catch (Exception e) {
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
        if (context == null || configuration == null) {
            Log.e(TAG, "Context or configuration is null, cannot start native performance");
            return false;
        }

        try {
            Log.d(TAG, "Starting native performance with configuration: " + configuration);
            
            PerformanceConfiguration config = PerformanceConfiguration.load(context);

            String apiKey = (String) configuration.get("apiKey");
            String endpoint = (String) configuration.get("endpoint");
            boolean autoInstrumentAppStarts = Boolean.TRUE.equals(configuration.get("autoInstrumentAppStarts"));
            boolean autoInstrumentViewLoads = Boolean.TRUE.equals(configuration.get("autoInstrumentViewLoads"));
            config.setApiKey(apiKey);
            config.setEndpoint(endpoint);
            config.setAutoInstrumentAppStarts(autoInstrumentAppStarts);
            config.setAutoInstrumentActivities(autoInstrumentViewLoads ? AutoInstrument.FULL : AutoInstrument.OFF);
            config.setAutoInstrumentRendering(true);

            if (configuration.containsKey("samplingProbability")) {
                Object samplingProb = configuration.get("samplingProbability");
                if (samplingProb instanceof Number) {
                    config.setSamplingProbability(((Number) samplingProb).doubleValue());
                }
            }

            if (configuration.containsKey("enabledMetrics")) {
                Object metricsConfigObj = configuration.get("enabledMetrics");
                if (metricsConfigObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> metricsConfig = (Map<String, Object>) metricsConfigObj;
                    EnabledMetrics enabledMetrics = new EnabledMetrics(
                        Boolean.TRUE.equals(metricsConfig.get("rendering")),
                        Boolean.TRUE.equals(metricsConfig.get("cpu")),
                        Boolean.TRUE.equals(metricsConfig.get("memory"))
                    );
                    config.setEnabledMetrics(enabledMetrics);
                }
            }

            if (!configuration.containsKey("nativeSpans") || Boolean.TRUE.equals(configuration.get("nativeSpans"))) {
                config.addPlugin(new BugsnagNativeSpansPlugin());
            }
            if (!configuration.containsKey("jsSpans") || Boolean.TRUE.equals(configuration.get("jsSpans"))) {
                config.addPlugin(new BugsnagJavascriptSpansPlugin());
            }
            if (!configuration.containsKey("nativeAppStarts") || Boolean.TRUE.equals(configuration.get("nativeAppStarts"))) {
                config.addPlugin(new BugsnagReactNativeAppStartPlugin());
            }

            BugsnagPerformance.start(config);
            Log.d(TAG, "Native performance started successfully");
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to start native performance", e);
            return false;
        }
    }

    public static void clearStartupConfig(Context context) {
        if (context == null) {
            return;
        }
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putBoolean("configured", false)
              .remove("startupConfig")
              .commit();
    }

    /**
     * Recursively wraps Maps, Lists, Arrays, and primitives into JSONObjects/JSONArrays.
     */
    private static Object wrapJson(Object o) {
        if (o == null) {
            return JSONObject.NULL;
        }
        if (o instanceof Map) {
            JSONObject jsonObject = new JSONObject();
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) o;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                try {
                    jsonObject.put(entry.getKey(), wrapJson(entry.getValue()));
                } catch (JSONException ignored) {
                }
            }
            return jsonObject;
        } else if (o instanceof Iterable) {
            JSONArray jsonArray = new JSONArray();
            for (Object item : (Iterable<?>) o) {
                jsonArray.put(wrapJson(item));
            }
            return jsonArray;
        } else if (o.getClass().isArray()) {
            JSONArray jsonArray = new JSONArray();
            int length = Array.getLength(o);
            for (int i = 0; i < length; i++) {
                jsonArray.put(wrapJson(Array.get(o, i)));
            }
            return jsonArray;
        }
        return o;
    }

    /**
     * Recursively converts a JSONObject to a Map, handling nested JSONObjects and JSONArrays properly.
     */
    private static Map<String, Object> convertJSONObjectToMap(JSONObject jsonObject) throws JSONException {
        Map<String, Object> map = new HashMap<>();
        
        Iterator<String> keys = jsonObject.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            Object value = jsonObject.get(key);
            map.put(key, convertJsonValue(value));
        }
        
        return map;
    }

    /**
     * Recursively converts a JSONArray to a List.
     */
    private static List<Object> convertJSONArrayToList(JSONArray jsonArray) throws JSONException {
        List<Object> list = new ArrayList<>();
        for (int i = 0; i < jsonArray.length(); i++) {
            list.add(convertJsonValue(jsonArray.get(i)));
        }
        return list;
    }

    /**
     * Handles recursive type conversion for JSON values.
     */
    private static Object convertJsonValue(Object value) throws JSONException {
        if (value == null || value == JSONObject.NULL) {
            return null;
        } else if (value instanceof JSONObject) {
            return convertJSONObjectToMap((JSONObject) value);
        } else if (value instanceof JSONArray) {
            return convertJSONArrayToList((JSONArray) value);
        }
        return value;
    }
}