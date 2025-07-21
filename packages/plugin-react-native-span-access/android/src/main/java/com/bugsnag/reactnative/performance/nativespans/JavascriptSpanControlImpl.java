package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import static com.bugsnag.reactnative.performance.nativespans.JavascriptSpanTransactionImpl.ID;
import static com.bugsnag.reactnative.performance.nativespans.JavascriptSpanTransactionImpl.NAME;

class JavascriptSpanControlImpl implements JavascriptSpanControl {
  private final String spanName;

  JavascriptSpanControlImpl(String spanName) {
    this.spanName = spanName;
  }

  @Override
  public JavascriptSpanTransaction createUpdateTransaction() {
    return new JavascriptSpanTransactionImpl(spanName);
  }

  @Override
  public void retrieveSpanContext(@NonNull OnSpanContextRetrievedCallback callback) {
    if (callback == null) {
      return;
    }

    BugsnagNativeSpans spans = BugsnagNativeSpans.getInstance();

    if (spans == null) {
      callback.onSpanContextRetrieved(null);
    }

    WritableMap retrieveSpanEvent = Arguments.createMap();
    retrieveSpanEvent.putString(NAME, spanName);

    int callbackId = spans.registerSpanContextCallback(callback);
    retrieveSpanEvent.putInt(ID, callbackId);

    if (!spans.emitRetrieveSpanContextEvent(retrieveSpanEvent)) {
      callback.onSpanContextRetrieved(null);
    }
  }
}
