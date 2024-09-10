package com.bugsnag.reactnative.scenariolauncher;

import androidx.annotation.NonNull;
import com.bugsnag.reactnative.scenariolauncher.NativeScenarioLauncherSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
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
}

