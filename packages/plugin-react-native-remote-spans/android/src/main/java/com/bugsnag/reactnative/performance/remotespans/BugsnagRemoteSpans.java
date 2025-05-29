package com.bugsnag.reactnative.performance.remotespans;

import androidx.annotation.Nullable;
import com.bugsnag.reactnative.performance.remotespans.NativeRemoteSpansSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

public class BugsnagRemoteSpans extends NativeRemoteSpansSpec {

  static final String MODULE_NAME = "BugsnagRemoteSpans";

  public BugsnagRemoteSpans(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public @Nullable WritableMap getSpanIdByName(String spanName) {
    return null;
  }

}

