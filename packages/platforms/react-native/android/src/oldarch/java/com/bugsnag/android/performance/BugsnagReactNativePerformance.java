package com.bugsnag.reactnative.performance;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.util.Map;

public class BugsnagReactNativePerformance extends ReactContextBaseJavaModule {
  
  private final NativeBugsnagPerformanceImpl impl;

  public BugsnagReactNativePerformance(ReactApplicationContext reactContext) {
    super(reactContext);
    this.impl = new NativeBugsnagPerformanceImpl(reactContext);
  }

  @Override
  public String getName() {
    return NativeBugsnagPerformanceImpl.MODULE_NAME;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap getDeviceInfo() {
    return impl.getDeviceInfo();
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String requestEntropy() {
    return impl.requestEntropy();
  }

  @ReactMethod
  public void requestEntropyAsync(Promise promise) {
    impl.requestEntropyAsync(promise);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean isNativePerformanceAvailable() {
    return impl.isNativePerformanceAvailable();
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap getNativeConfiguration() {
    return impl.getNativeConfiguration();
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap startNativeSpan(String name, ReadableMap options) {
    return impl.startNativeSpan(name, options);
  }

  @ReactMethod
  public void endNativeSpan(String spanId, double endTime, ReadableMap attributes, Promise promise) {
    impl.endNativeSpan(spanId, endTime, attributes, promise);
  }
}
