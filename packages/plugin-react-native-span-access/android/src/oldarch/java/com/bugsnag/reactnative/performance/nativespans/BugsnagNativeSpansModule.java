package com.bugsnag.reactnative.performance.nativespans;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

import androidx.annotation.Nullable;

@ReactModule(name = BugsnagNativeSpans.MODULE_NAME)
public class BugsnagNativeSpansModule extends ReactContextBaseJavaModule {
    private final BugsnagNativeSpans delegate;

    public BugsnagNativeSpansModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.delegate = new BugsnagNativeSpans(reactContext);
    }

    @Override
    public String getName() {
        return BugsnagNativeSpans.MODULE_NAME;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public WritableMap getSpanIdByName(String spanName) {
        return delegate.getSpanIdByName(spanName);
    }

    @ReactMethod
    public void updateSpan(ReadableMap spanId, ReadableMap updates, Promise promise) {
        delegate.updateSpan(spanId, updates, promise);
    }

    @ReactMethod
    public void addListener(String eventType) {
        // noop - required for EventEmitter support
    }

    @ReactMethod
    public void removeListeners(double count) {
        // noop - required for EventEmitter support
    }
}
