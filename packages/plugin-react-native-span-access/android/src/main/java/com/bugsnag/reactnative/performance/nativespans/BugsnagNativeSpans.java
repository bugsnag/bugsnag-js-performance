package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.Nullable;

import android.util.SparseArray;

import com.bugsnag.android.performance.Span;
import com.bugsnag.android.performance.RemoteSpanContext;
import com.bugsnag.android.performance.internal.BugsnagClock;
import com.bugsnag.android.performance.internal.EncodingUtils;
import com.bugsnag.reactnative.performance.ReactNativeSpanAttributes;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

class BugsnagNativeSpans {

  // Attribute keys
  private static final String ATTRIBUTES = "attributes";
  private static final String ATTR_NAME = "name";
  private static final String ATTR_VALUE = "value";

  // Span properties
  private static final String END_TIME = "endTime";
  private static final String IS_ENDED = "isEnded";
  private static final String SPAN_ID = "spanId";
  private static final String TRACE_ID = "traceId";

  private static final String SPAN_UPDATE_EVENT_TYPE = "bugsnag:spanUpdate";
  private static final String RETRIEVE_SPAN_CONTEXT_EVENT_TYPE = "bugsnag:retrieveSpanContext";

  private static volatile BugsnagNativeSpans INSTANCE;

  static final String MODULE_NAME = "BugsnagNativeSpans";

  private final ReactApplicationContext reactContext;

  private final CallbackState<OnRemoteSpanUpdatedCallback> updateCallbacks = new CallbackState<>();
  private final CallbackState<OnSpanContextRetrievedCallback> spanContextCallbacks = new CallbackState<>();

  public BugsnagNativeSpans(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;

    INSTANCE = this;
  }

  static @Nullable BugsnagNativeSpans getInstance() {
    return INSTANCE;
  }

  @Nullable
  public WritableMap getSpanIdByName(String spanName) {
    BugsnagNativeSpansPlugin nativeSpanAccessPlugin = BugsnagNativeSpansPlugin.getInstance();

    if (nativeSpanAccessPlugin == null) {
      return null;
    }

    Span span = nativeSpanAccessPlugin.getSpanByName(spanName);
    if (span == null) {
      return null;
    }

    WritableMap map = Arguments.createMap();
    map.putString(SPAN_ID, EncodingUtils.toHexString(span.getSpanId()));
    map.putString(TRACE_ID, EncodingUtils.toHexString(span.getTraceId()));

    return map;
  }

  public void updateSpan(ReadableMap spanId, ReadableMap updates, Promise promise) {
    BugsnagNativeSpansPlugin nativeSpanAccessPlugin = BugsnagNativeSpansPlugin.getInstance();

    if (nativeSpanAccessPlugin == null) {
      promise.resolve(false);
      return;
    }

    String traceIdHex = spanId.getString(TRACE_ID);
    String spanIdHex = spanId.getString(SPAN_ID);
    Span span = nativeSpanAccessPlugin.getSpanById(traceIdHex, spanIdHex);
    if (span == null) {
      promise.resolve(false);
      return;
    }

    ReadableArray attributes = updates.getArray(ATTRIBUTES);
    if (attributes != null) {
      updateSpanAttributes(attributes, span);
    }

    if (updates.getBoolean(IS_ENDED)) {
      endSpan(updates, span);
    }

    promise.resolve(true);
  }

  public void reportSpanUpdateResult(double eventId, boolean result, Promise promise) {
    try {
      onRemoteSpanUpdated((int) eventId, result);
    } finally {
      promise.resolve(null);
    }
  }

  public void reportSpanContextResult(double eventId, String result, Promise promise) {
    try {
      onRemoteSpanContextRetrieved((int) eventId, result);
    } finally {
      promise.resolve(null);
    }
  }

  boolean emitSpanUpdateEvent(ReadableMap updates) {
    try {
      RCTDeviceEventEmitter eventEmitter = reactContext.getJSModule(RCTDeviceEventEmitter.class);
      if (eventEmitter == null) {
        return false;
      }
      eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updates);
      return true;
    } catch (IllegalStateException ise) {
      return false; // This can happen if the React context is not active
    }
  }

  boolean emitRetrieveSpanContextEvent(ReadableMap request) {
    try {
      RCTDeviceEventEmitter eventEmitter = reactContext.getJSModule(RCTDeviceEventEmitter.class);
      if (eventEmitter == null) {
        return false;
      }
      eventEmitter.emit(RETRIEVE_SPAN_CONTEXT_EVENT_TYPE, request);
      return true;
    } catch (IllegalStateException ise) {
      return false; // This can happen if the React context is not active
    }
  }

  private void onRemoteSpanUpdated(int callbackId, boolean updateResult) {
    OnRemoteSpanUpdatedCallback callback = takeUpdateCallback(callbackId);
    if (callback != null) {
      callback.onRemoteSpanUpdated(updateResult);
    }
  }

  private void onRemoteSpanContextRetrieved(int callbackId, String result) {
    OnSpanContextRetrievedCallback callback = takeSpanContextCallback(callbackId);
    if (callback != null) {
      RemoteSpanContext remoteSpanContext = RemoteSpanContext.parseTraceParentOrNull(result);
      callback.onSpanContextRetrieved(remoteSpanContext);
    }
  }

  int registerUpdateCallback(OnRemoteSpanUpdatedCallback callback) {
    return updateCallbacks.registerCallback(callback);
  }

  int registerSpanContextCallback(OnSpanContextRetrievedCallback callback) {
    return spanContextCallbacks.registerCallback(callback);
  }

  @Nullable
  OnRemoteSpanUpdatedCallback takeUpdateCallback(int callbackId) {
    return updateCallbacks.takeCallback(callbackId);
  }

  @Nullable
  OnSpanContextRetrievedCallback takeSpanContextCallback(int callbackId) {
    return spanContextCallbacks.takeCallback(callbackId);
  }

  private static void endSpan(ReadableMap updates, Span span) {
    if (updates.hasKey(END_TIME)) {
      String endTimeTimestamp = updates.getString(END_TIME);
      span.end(BugsnagClock.INSTANCE.unixNanoTimeToElapsedRealtime(Long.parseLong(endTimeTimestamp)));
    } else {
      span.end();
    }
  }

  private static void updateSpanAttributes(ReadableArray attributeUpdates, Span span) {
    for (int i = 0; i < attributeUpdates.size(); i++) {
      ReadableMap attribute = attributeUpdates.getMap(i);
      String name = attribute.getString(ATTR_NAME);
      ReadableType type = attribute.getType(ATTR_VALUE);

      switch (type) {
        case Null:
          span.setAttribute(name, (String) null);
          break;
        case Boolean:
          span.setAttribute(name, attribute.getBoolean(ATTR_VALUE));
          break;
        case Number:
          setNumberAttribute(span, attribute, name);
          break;
        case String:
          span.setAttribute(name, attribute.getString(ATTR_VALUE));
          break;
        case Array:
          setArrayAttribute(span, attribute, name);
          break;
      }
    }
  }

  private static void setArrayAttribute(Span span, ReadableMap attribute, String name) {
    Object array = ReactNativeSpanAttributes.transformArray(attribute.getArray(ATTR_VALUE));
    if (array instanceof String[]) {
      span.setAttribute(name, (String[]) array);
    } else if (array instanceof long[]) {
      span.setAttribute(name, (long[]) array);
    } else if (array instanceof double[]) {
      span.setAttribute(name, (double[]) array);
    }
  }

  private static void setNumberAttribute(Span span, ReadableMap attribute, String name) {
    double n = attribute.getDouble(ATTR_VALUE);
    if (isInteger(n)) {
      span.setAttribute(name, (long) n);
    } else {
      span.setAttribute(name, n);
    }
  }

  private static boolean isInteger(double n) {
    return n % 1 == 0;
  }
}
