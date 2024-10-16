package com.bugsnag.reactnative.scenariolauncher;

import android.util.Log;
import android.content.Context;
import android.content.SharedPreferences;

import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;
import com.bugsnag.android.Logger;

import com.bugsnag.android.performance.AutoInstrument;
import com.bugsnag.android.performance.BugsnagPerformance;
import com.bugsnag.android.performance.PerformanceConfiguration;
import com.bugsnag.android.performance.Span;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.IOException;

class ScenarioLauncherImpl {
  
  static final String MODULE_NAME = "ScenarioLauncher";
  
  private final ReactApplicationContext reactContext;

  public ScenarioLauncherImpl(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

  public void startBugsnag(ReadableMap configuration, Promise promise) {
    Configuration bugsnagConfig = new Configuration(configuration.getString("apiKey"));
    bugsnagConfig.setEndpoints(new EndpointConfiguration(configuration.getString("notifyEndpoint"), configuration.getString("sessionsEndpoint")));

    bugsnagConfig.setLogger(new Logger() {
      private static final String TAG = "Bugsnag";

      @Override
      public void e(String msg) {
          Log.e(TAG, msg);
      }

      @Override
      public void e(String msg, Throwable throwable) {
          Log.e(TAG, msg, throwable);
      }

      @Override
      public void w(String msg) {
          Log.w(TAG, msg);
      }

      @Override
      public void w(String msg, Throwable throwable) {
          Log.w(TAG, msg, throwable);
      }

      @Override
      public void i(String msg) {
          Log.i(TAG, msg);
      }

      @Override
      public void i(String msg, Throwable throwable) {
          Log.i(TAG, msg, throwable);
      }

      @Override
      public void d(String msg) {
          Log.d(TAG, msg);
      }

      @Override
      public void d(String msg, Throwable throwable) {
          Log.d(TAG, msg, throwable);
      }
    });
    Bugsnag.start(reactContext, bugsnagConfig);
    promise.resolve(true);
  }

  public void clearPersistentData() {
    File deviceIdFile = new File(reactContext.getFilesDir(), "device-id");
        if (deviceIdFile.exists()) {
            try {
                deviceIdFile.delete();
            } catch (Exception e) {
                Log.e("Bugsnag", "Failed to delete device id file", e);
            }
        }
  }

  public void saveStartupConfig(ReadableMap configuration) {
    SharedPreferences sharedPreferences = this.reactContext.getApplicationContext().getSharedPreferences("StartupConfig", Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = sharedPreferences.edit();
    editor.putBoolean("configured", true);

    if (configuration.hasKey("apiKey")) {
        editor.putString("apiKey", configuration.getString("apiKey"));
    }

    if (configuration.hasKey("endpoint")) {
        editor.putString("endpoint", configuration.getString("endpoint"));
    }

    if (configuration.hasKey("autoInstrumentAppStarts")) {
        editor.putBoolean("autoInstrumentAppStarts", configuration.getBoolean("autoInstrumentAppStarts"));
    }

    if (configuration.hasKey("autoInstrumentNetworkRequests")) {
        editor.putBoolean("autoInstrumentNetworkRequests", configuration.getBoolean("autoInstrumentNetworkRequests"));
    }

    if (configuration.hasKey("maximumBatchSize")) {
        editor.putInt("maximumBatchSize", configuration.getInt("maximumBatchSize"));
    }

    editor.commit();
  }

  public WritableMap readStartupConfig() {
    SharedPreferences sharedPreferences = this.reactContext.getApplicationContext().getSharedPreferences("StartupConfig", Context.MODE_PRIVATE);;
    try {
        if (!sharedPreferences.getBoolean("configured", false)) {
            return null;
        }
        
        WritableMap startupConfig = Arguments.createMap();
        startupConfig.putString("apiKey", sharedPreferences.getString("apiKey", ""));
        startupConfig.putString("endpoint", sharedPreferences.getString("endpoint", ""));
        startupConfig.putBoolean("autoInstrumentAppStarts", sharedPreferences.getBoolean("autoInstrumentAppStarts", false));
        startupConfig.putBoolean("autoInstrumentNetworkRequests", sharedPreferences.getBoolean("autoInstrumentNetworkRequests", false));
        startupConfig.putInt("maximumBatchSize", sharedPreferences.getInt("maximumBatchSize", 100));
        return startupConfig;
    }
    finally {
        // make sure we don't leave this config around for the next startup
        sharedPreferences.edit()
            .putBoolean("configured", false)
            .remove("apiKey")
            .remove("endpoint")
            .remove("autoInstrumentAppStarts")
            .remove("autoInstrumentNetworkRequests")
            .remove("maximumBatchSize")
            .commit();
    }
  }

  public void exitApp() {
    System.exit(0);
  }

  public void startNativePerformance(ReadableMap configuration, Promise promise) {
    try {
        PerformanceConfiguration config = PerformanceConfiguration.load(reactContext);
        config.setApiKey(configuration.getString("apiKey"));
        config.setEndpoint(configuration.getString("endpoint"));
        config.setAutoInstrumentAppStarts(false);
        config.setAutoInstrumentActivities(AutoInstrument.OFF);

        BugsnagPerformance.start(config);
        Log.d(MODULE_NAME, "Started Android performance");
    
        Span span = BugsnagPerformance.startSpan("NativeIntegration");
        span.end();

        // Move the app to the background to force the queue to flush
        reactContext.getCurrentActivity().moveTaskToBack(true);

    } catch (Exception e) {
        Log.d(MODULE_NAME, "Failed to start Android performance", e);
    }

    promise.resolve(true);
  }
}
