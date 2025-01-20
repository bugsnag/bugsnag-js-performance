package com.bugsnag.reactnative.performance;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
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
}
