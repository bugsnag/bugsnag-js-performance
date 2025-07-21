package com.bugsnag.reactnative.scenariolauncher;

import androidx.annotation.NonNull;
import com.bugsnag.reactnative.scenariolauncher.NativeScenarioLauncherSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

public class ScenarioLauncher extends NativeScenarioLauncherSpec {
  private final ScenarioLauncherImpl impl;

  public ScenarioLauncher(ReactApplicationContext reactContext) {
    super(reactContext);
    impl = new ScenarioLauncherImpl(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return ScenarioLauncherImpl.MODULE_NAME;
  }

  @Override
  public void startBugsnag(ReadableMap configuration, Promise promise) {
    impl.startBugsnag(configuration, promise);
  }

  @Override
  public void clearPersistentData() {
    impl.clearPersistentData();
  }

  @Override
  public void saveStartupConfig(ReadableMap configuration) {
    impl.saveStartupConfig(configuration);
  }

  @Override
  public WritableMap readStartupConfig() {
    return impl.readStartupConfig();
  }

  @Override
  public void exitApp() {
    impl.exitApp();
  }

  @Override
  public void startNativePerformance(ReadableMap configuration, Promise promise) {
    impl.startNativePerformance(configuration, promise);
  }

  @Override
  public void startNativeSpan(ReadableMap options, Promise promise) {
    impl.startNativeSpan(options, promise);
  }

  @Override
  public void endNativeSpan(String traceParent, Promise promise) {
    impl.endNativeSpan(traceParent, promise);
  }

  @Override
  public void updateJavascriptSpan(String spanName, ReadableArray attributes, Promise promise) {
    impl.updateJavascriptSpan(spanName, attributes, promise);
  }

  @Override
  public void sendNativeSpanWithJsParent(String spanName, Promise promise) {
    impl.sendNativeSpanWithJsParent(spanName, promise);
  }
}

