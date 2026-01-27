package com.bugsnag.reactnative.scenariolauncher;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class ScenarioLauncherPackage extends TurboReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if(name.equals(ScenarioLauncherImpl.MODULE_NAME)) {
      return new ScenarioLauncher(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return new ReactModuleInfoProvider() {
      public Map<String, ReactModuleInfo> getReactModuleInfos() {
        return Collections.singletonMap(
          ScenarioLauncherImpl.MODULE_NAME,
          new ReactModuleInfo(
            ScenarioLauncherImpl.MODULE_NAME,
            ScenarioLauncherImpl.MODULE_NAME,
            false, // canOverrideExistingModule
            true,  // needsEagerInit
            false, // hasConstants
            false, // isCxxModule
            true   // isTurboModule
          )
        );
      }
    };
  }
}