package com.bugsnag.reactnative.performance.remotespans;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = BugsnagRemoteSpans.MODULE_NAME)
public class BugsnagRemoteSpansModule extends NativeBugsnagRemoteSpansSpec {
    private final BugsnagRemoteSpans delegate;

    public BugsnagRemoteSpansModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.delegate = new BugsnagRemoteSpans(reactContext);
    }

    @Override
    public @Nullable WritableMap getSpanIdByName(String spanName) {
        return delegate.getSpanIdByName(spanName);
    }

    @Override
    public void updateSpan(ReadableMap spanId, ReadableMap updates, Promise promise) {
        delegate.updateSpan(spanId, updates, promise);
    }
}
