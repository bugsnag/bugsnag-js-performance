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
}

