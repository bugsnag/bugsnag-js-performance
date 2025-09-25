package com.bugsnag.reactnative.scenariolauncher;

import android.util.Log;
import android.content.Context;

import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Configuration;
import com.bugsnag.android.EndpointConfiguration;
import com.bugsnag.android.Logger;

import com.bugsnag.android.performance.AutoInstrument;
import com.bugsnag.android.performance.BugsnagPerformance;

import com.bugsnag.android.performance.RemoteSpanContext;
import com.bugsnag.android.performance.Span;
import com.bugsnag.android.performance.SpanOptions;
import com.bugsnag.android.performance.SpanContext;

import com.bugsnag.reactnative.performance.nativespans.JavascriptSpanByName;
import com.bugsnag.reactnative.performance.nativespans.JavascriptSpanControl;
import com.bugsnag.reactnative.performance.nativespans.JavascriptSpanTransaction;
import com.bugsnag.reactnative.performance.nativespans.OnRemoteSpanUpdatedCallback;
import com.bugsnag.reactnative.performance.nativespans.OnSpanContextRetrievedCallback;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.bugsnag.test.utils.BugsnagTestUtils;

class ScenarioLauncherImpl {

  static final String MODULE_NAME = "ScenarioLauncher";

  private final ReactApplicationContext reactContext;

  private final HashMap<String, Span> openSpans = new HashMap<>();

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
    BugsnagTestUtils.saveStartupConfig(this.reactContext.getApplicationContext(), configuration.toHashMap());
  }

  public WritableMap readStartupConfig() {
    try {
      Map<String, Object> config = BugsnagTestUtils.readStartupConfig(this.reactContext.getApplicationContext());

      if (config == null) {
        return null;
      }

      WritableMap startupConfig = Arguments.createMap();
      startupConfig.putString("apiKey", (String) config.getOrDefault("apiKey", ""));
      startupConfig.putString("endpoint", (String) config.getOrDefault("endpoint", ""));
      startupConfig.putBoolean("autoInstrumentAppStarts", (Boolean) config.getOrDefault("autoInstrumentAppStarts", false));
      startupConfig.putBoolean("autoInstrumentNetworkRequests", (Boolean) config.getOrDefault("autoInstrumentNetworkRequests", false));
      startupConfig.putInt("maximumBatchSize", (Integer) config.getOrDefault("maximumBatchSize", 100));
      startupConfig.putBoolean("useWrapperComponentProvider", (Boolean) config.getOrDefault("useWrapperComponentProvider", false));
      startupConfig.putString("scenario", (String) config.getOrDefault("scenario", ""));
      startupConfig.putBoolean("attach", (Boolean) config.getOrDefault("attach", false));
      return startupConfig;
    } finally {
      // make sure we don't leave this config around for the next startup
      BugsnagTestUtils.clearStartupConfig(this.reactContext.getApplicationContext());
    }
  }

  public void exitApp() {
    System.exit(0);
  }

  public void startNativePerformance(ReadableMap configuration, Promise promise) {
    try {
      if (BugsnagTestUtils.startNativePerformance(reactContext.getApplicationContext(), configuration.toHashMap())) {
        promise.resolve(true);
      } else {
        promise.reject(new IllegalStateException("Failed to start native performance, check logs for details"));
      }
    } catch (Exception e) {
      Log.d(MODULE_NAME, "Failed to start Android performance", e);
      promise.reject(e);
    }
  }

  public void startNativeSpan(ReadableMap options, Promise promise) {
    try {
      SpanOptions spanOptions = SpanOptions.DEFAULTS;
      if (options.hasKey("traceParent")) {
        RemoteSpanContext remoteSpanContext = RemoteSpanContext.parseTraceParent(options.getString("traceParent"));
        spanOptions = spanOptions.createWithin(remoteSpanContext);
      }

      Span span = BugsnagPerformance.startSpan(options.getString("name"), spanOptions);
      String traceParent = RemoteSpanContext.encodeAsTraceParent(span);
      openSpans.put(traceParent, span);
      promise.resolve(traceParent);
    } catch (Exception e) {
      Log.d(MODULE_NAME, "Failed to start native span", e);
      promise.reject(e);
    }
  }

  public void endNativeSpan(String traceParent, Promise promise) {
    Span span = openSpans.remove(traceParent);
    if (span != null) {
      span.end();
      promise.resolve(true);
    } else {
      Log.d(MODULE_NAME, "No open span found for traceParent: " + traceParent);
      promise.resolve(false);
    }
  }

  public void updateJavascriptSpan(
    String spanName,
    ReadableArray attributes,
    final Promise promise
  ) {
    Log.d(MODULE_NAME, "Updating Javascript span: " + spanName);
    JavascriptSpanControl spanControl = BugsnagPerformance.getSpanControls(new JavascriptSpanByName(spanName));
    JavascriptSpanTransaction transaction = spanControl.createUpdateTransaction();

    for (int i = 0; i < attributes.size(); i++) {
      ReadableMap attribute = attributes.getMap(i);
      if (attribute != null) {
        String name = attribute.getString("name");
        if (name != null) {
          Dynamic value = attribute.getDynamic("value");

          switch (value.getType()) {
            case Null:
              transaction.setAttribute(name, null);
              break;
            case Boolean:
              transaction.setAttribute(name, value.asBoolean());
              break;
            case Number:
              transaction.setAttribute(name, value.asDouble());
              break;
            case String:
              transaction.setAttribute(name, value.asString());
              break;
            case Array:
              transaction.setAttribute(name, value.asArray().toArrayList());
              break;
          }
        }
      }
    }

    Log.d(MODULE_NAME, "Ending transaction for span: " + spanName);
    transaction
      .end()
      .commit(new OnRemoteSpanUpdatedCallback() {
        public void onRemoteSpanUpdated(boolean updateResult) {
          Log.d(MODULE_NAME, "Span update result: " + updateResult);
          promise.resolve(null);
        }
      });
  }

  public void sendNativeSpanWithJsParent(String spanName, final Promise promise) {
    Log.d(MODULE_NAME, "Sending Native span as child of: " + spanName);
    JavascriptSpanControl spanControl = BugsnagPerformance.getSpanControls(new JavascriptSpanByName(spanName));
    spanControl.retrieveSpanContext(new OnSpanContextRetrievedCallback() {
      public void onSpanContextRetrieved(SpanContext remoteSpanContext) {
        if (remoteSpanContext != null) {
          BugsnagPerformance.startSpan("Native Child Span", SpanOptions.createWithin(remoteSpanContext)).end();
          promise.resolve(null);
        } else {
          promise.reject(new NullPointerException("Failed to get JS span context"));
        }
      }
    });
  }
}
