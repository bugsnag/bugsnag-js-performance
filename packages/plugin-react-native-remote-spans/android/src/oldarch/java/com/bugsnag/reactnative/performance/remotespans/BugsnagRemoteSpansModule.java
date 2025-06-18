package com.bugsnag.reactnative.performance.remotespans;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

import androidx.annotation.Nullable;

@ReactModule(name = BugsnagRemoteSpans.MODULE_NAME)
public class BugsnagRemoteSpansModule extends ReactContextBaseJavaModule {
    private final BugsnagRemoteSpans delegate;

    public BugsnagRemoteSpansModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.delegate = new BugsnagRemoteSpans(reactContext);
    }

    @Override
    public String getName() {
        return BugsnagRemoteSpans.MODULE_NAME;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public WritableMap getSpanIdByName(String spanName) {
        return delegate.getSpanIdByName(spanName);
    }

    @ReactMethod
    public void updateSpan(ReadableMap spanId, ReadableMap updates, Promise promise) {
        delegate.updateSpan(spanId, updates, promise);
    }
}
