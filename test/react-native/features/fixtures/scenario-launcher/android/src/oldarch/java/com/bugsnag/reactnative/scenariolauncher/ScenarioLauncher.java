package com.bugsnag.reactnative.scenariolauncher;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.util.Map;

public class ScenarioLauncher extends ReactContextBaseJavaModule {
  
  private final ScenarioLauncherImpl impl;

  public ScenarioLauncher(ReactApplicationContext reactContext) {
    super(reactContext);
    this.impl = new ScenarioLauncherImpl(reactContext);
  }

  @Override
  public String getName() {
    return ScenarioLauncherImpl.MODULE_NAME;
  }

  @ReactMethod
  public void startBugsnag(ReadableMap configuration, Promise promise) {
    impl.startBugsnag(configuration, promise);
  }

  @ReactMethod
  public void clearPersistentData() {
    impl.clearPersistentData();
  }
}