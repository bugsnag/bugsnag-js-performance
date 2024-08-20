package com.bugsnag.reactnative.scenariolauncher;

import android.util.Log;
import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;
import com.bugsnag.android.Logger;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;

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
}
