package com.bugsnag.reactnative.performance;

import androidx.annotation.NonNull;
import com.bugsnag.reactnative.performance.NativeBugsnagPerformanceSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
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

  @Override
  public boolean isNativePerformanceAvailable() {
    return impl.isNativePerformanceAvailable();
  }

  @Override
  public WritableMap getNativeConfiguration() {
    return impl.getNativeConfiguration();
  }

  @Override 
  public WritableMap startNativeSpan(String name, ReadableMap options) {
    return impl.startNativeSpan(name, options);
  }

  @Override
  public void endNativeSpan(String spanId, String traceId, double endTime, ReadableMap attributes, Promise promise) {
    impl.endNativeSpan(spanId, traceId, endTime, attributes, promise);
  }

  @Override 
  public void markNativeSpanEndTime(String spanId, String traceId, double endTime) {
    impl.markNativeSpanEndTime(spanId, traceId, endTime);
  }

  @Override
  public void discardNativeSpan(String spanId, String traceId, Promise promise) {
    impl.discardNativeSpan(spanId, traceId, promise);
  }

  @Override
  public void discardAllNativeSpans(Promise promise) {
    impl.discardAllNativeSpans(promise);
  }
}

