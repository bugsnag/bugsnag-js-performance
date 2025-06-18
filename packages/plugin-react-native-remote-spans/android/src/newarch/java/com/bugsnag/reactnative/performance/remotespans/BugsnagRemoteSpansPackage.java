package com.bugsnag.reactnative.performance.remotespans;

import androidx.annotation.Nullable;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class BugsnagRemoteSpansPackage extends TurboReactPackage {
  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(BugsnagRemoteSpans.MODULE_NAME)) {
      return new BugsnagRemoteSpansModule(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      moduleInfos.put(
        BugsnagRemoteSpans.MODULE_NAME,
        new ReactModuleInfo(
          BugsnagRemoteSpans.MODULE_NAME,
          BugsnagRemoteSpans.MODULE_NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true,  // hasConstants
          false, // isCxxModule
          true   // isTurboModule
        )
      );
      return moduleInfos;
    };
  }
}
