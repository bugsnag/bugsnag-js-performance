package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = BugsnagNativeSpans.MODULE_NAME)
public class BugsnagNativeSpansModule extends NativeBugsnagNativeSpansSpec {
    private final BugsnagNativeSpans delegate;

    public BugsnagNativeSpansModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.delegate = new BugsnagNativeSpans(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return BugsnagNativeSpans.MODULE_NAME;
    }

    @Override
    public @Nullable WritableMap getSpanIdByName(String spanName) {
        return delegate.getSpanIdByName(spanName);
    }

    @Override
    public void updateSpan(ReadableMap spanId, ReadableMap updates, Promise promise) {
        delegate.updateSpan(spanId, updates, promise);
    }

    @Override
    public void addListener(String eventType) {
        // noop - required for EventEmitter support
    }

    @Override
    public void removeListeners(double count) {
        // noop - required for EventEmitter support
    }
}
