package com.bugsnag.android.performance;

import androidx.annotation.NonNull;
import com.bugsnag.android.performance.NativeBugsnagPerformanceSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;

public class NativeBugsnagPerformanceImpl extends NativeBugsnagPerformanceSpec {
  
  static final String NAME = "BugsnagReactNativePerformance";
  
  public NativeBugsnagPerformanceImpl(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public WritableMap getDeviceInfo() {
    WritableMap map = Arguments.createMap();
    map.putString("versionCode", "12345");
    map.putString("arch", "arm64");
    map.putString("bundleVersion", "");
    return map;
  }
}
