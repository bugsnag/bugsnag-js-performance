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
  public WritableMap getNativeConstants() {
    return impl.getNativeConstants();
  }

  @ReactMethod
  public void exists(String path, Promise promise) {
    impl.exists(path, promise);
  }

  @ReactMethod
  public void isDir(String path, Promise promise) {
    impl.isDir(path, promise);
  }

  @ReactMethod
  public void ls(String path, Promise promise) {
    impl.ls(path, promise);
  }

  @ReactMethod
  public void mkdir(String path, Promise promise) {
    impl.mkdir(path, promise);
  }

  @ReactMethod
  public void readFile(String path, String encoding, Promise promise) {
    impl.readFile(path, encoding, promise);
  }

  @ReactMethod
  public void unlink(String path, Promise promise) {
    impl.unlink(path, promise);
  }

  @ReactMethod
  public void writeFile(String path, String data, String encoding, Promise promise) {
    impl.writeFile(path, data, encoding, promise);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean isNativePerformanceAvailable() {
    return impl.isNativePerformanceAvailable();
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap attachToNativeSDK() {
    return impl.attachToNativeSDK();
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap startNativeSpan(String name, ReadableMap options) {
    return impl.startNativeSpan(name, options);
  }

  @ReactMethod
  public void endNativeSpan(String spanId, String traceId, double endTime, ReadableMap attributes, Promise promise) {
    impl.endNativeSpan(spanId, traceId, endTime, attributes,  promise);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public void markNativeSpanEndTime(String spanId, String traceId, double endTime) {
    impl.markNativeSpanEndTime(spanId, traceId, endTime);
  }

  @ReactMethod
  public void discardNativeSpan(String spanId, String traceId, Promise promise) {
    impl.discardNativeSpan(spanId, traceId, promise);
  }
}
