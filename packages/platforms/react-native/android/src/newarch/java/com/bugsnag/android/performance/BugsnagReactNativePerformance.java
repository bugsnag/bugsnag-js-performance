package com.bugsnag.reactnative.performance;

import androidx.annotation.NonNull;
import com.bugsnag.reactnative.performance.NativeBugsnagPerformanceSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;

public class BugsnagReactNativePerformance extends NativeBugsnagPerformanceSpec {
  private final NativeBugsnagPerformanceImpl impl;

  public BugsnagReactNativePerformance(ReactApplicationContext reactContext) {
    super(reactContext);
    impl = new NativeBugsnagPerformanceImpl(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NativeBugsnagPerformanceImpl.MODULE_NAME;
  }

  @Override
  public WritableMap getDeviceInfo() {
    return impl.getDeviceInfo();
  }

  @Override
  public String requestEntropy() {
    return impl.requestEntropy();
  }

  @Override
  public void requestEntropyAsync(Promise promise) {
    impl.requestEntropyAsync(promise);
  }
}

