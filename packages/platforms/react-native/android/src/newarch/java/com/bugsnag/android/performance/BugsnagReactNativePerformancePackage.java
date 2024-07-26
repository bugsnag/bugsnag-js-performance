package com.bugsnag.reactnative.performance;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class BugsnagReactNativePerformancePackage extends TurboReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if(name.equals(NativeBugsnagPerformanceImpl.MODULE_NAME)) {
      return new BugsnagReactNativePerformance(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return new ReactModuleInfoProvider() {
      public Map<String, ReactModuleInfo> getReactModuleInfos() {
        return Collections.singletonMap(
          NativeBugsnagPerformanceImpl.MODULE_NAME,
          new ReactModuleInfo(
            NativeBugsnagPerformanceImpl.MODULE_NAME,
            NativeBugsnagPerformanceImpl.MODULE_NAME,
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