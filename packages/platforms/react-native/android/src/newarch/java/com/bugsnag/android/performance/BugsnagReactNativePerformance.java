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
  public WritableMap getNativeConstants() {
    return impl.getNativeConstants();
  }

  @Override
  public void exists(String path, Promise promise) {
    impl.exists(path, promise);
  }

  @Override
  public void isDir(String path, Promise promise) {
    impl.isDir(path, promise);
  }

  @Override
  public void ls(String path, Promise promise) {
    impl.ls(path, promise);
  }

  @Override
  public void mkdir(String path, Promise promise) {
    impl.mkdir(path, promise);
  }

  @Override
  public void readFile(String path, String encoding, Promise promise) {
    impl.readFile(path, encoding, promise);
  }

  @Override
  public void unlink(String path, Promise promise) {
    impl.unlink(path, promise);
  }

  @Override
  public void writeFile(String path, String data, String encoding, Promise promise){
    impl.writeFile(path, data, encoding, promise);
  }

  @Override
  public boolean isNativePerformanceAvailable() {
    return impl.isNativePerformanceAvailable();
  }

  @Override
  public WritableMap attachToNativeSDK() {
    return impl.attachToNativeSDK();
  }

  @Override
  public WritableMap startNativeSpan(String name, ReadableMap options) {
    return impl.startNativeSpan(name, options);
  }

  @Override
  public void endNativeSpan(String spanId, String traceId, String endTime, ReadableMap attributes, Promise promise) {
    impl.endNativeSpan(spanId, traceId, endTime, attributes, promise);
  }

  @Override
  public void markNativeSpanEndTime(String spanId, String traceId, String endTime) {
    impl.markNativeSpanEndTime(spanId, traceId, endTime);
  }

  @Override
  public void discardNativeSpan(String spanId, String traceId, Promise promise) {
    impl.discardNativeSpan(spanId, traceId, promise);
  }
}

