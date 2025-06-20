package com.bugsnag.reactnative.performance.nativespans;

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

public class BugsnagNativeSpansPackage extends TurboReactPackage {
    @Nullable
    @Override
    public NativeModule getModule(String name, ReactApplicationContext reactContext) {
        if (name.equals(BugsnagNativeSpans.MODULE_NAME)) {
            return new BugsnagNativeSpansModule(reactContext);
        } else {
            return null;
        }
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return () -> {
            final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
            moduleInfos.put(
                BugsnagNativeSpans.MODULE_NAME,
                new ReactModuleInfo(
                    BugsnagNativeSpans.MODULE_NAME,
                    BugsnagNativeSpans.MODULE_NAME,
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
