package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.Nullable;

import android.util.SparseArray;

import com.bugsnag.android.performance.Span;
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

  private static final String SPAN_UPDATE_EVENT_TYPE = "JavascriptSpanUpdate";

  private static volatile BugsnagNativeSpans INSTANCE;

  static final String MODULE_NAME = "BugsnagNativeSpans";

  private final ReactApplicationContext reactContext;
  private final RCTDeviceEventEmitter eventEmitter;

  private final SparseArray<OnRemoteSpanUpdatedCallback> updateCallbacks = new SparseArray<>(4);
  private int nextCallbackId = 0;

  public BugsnagNativeSpans(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
    this.eventEmitter = reactContext.getJSModule(RCTDeviceEventEmitter.class);

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
    android.util.Log.d(MODULE_NAME, "Reporting span update result: " + result + " for eventId: " + eventId);
    onRemoteSpanUpdated((int) eventId, result);
    promise.resolve(null);
  }

  public void reportSpanContextResult(double eventId, String result, Promise promise) {
      // TODO: retrieve callback and invoke with the result
      promise.resolve(null);
  }

  void emitSpanUpdateEvent(ReadableMap updates) {
    android.util.Log.d(MODULE_NAME, "Emitting span update event: " + updates);
    eventEmitter.emit(SPAN_UPDATE_EVENT_TYPE, updates);
  }

  private void onRemoteSpanUpdated(int callbackId, boolean updateResult) {
    OnRemoteSpanUpdatedCallback callback = takeUpdateCallback(callbackId);
    if (callback != null) {
      callback.onRemoteSpanUpdated(updateResult);
    }
  }

  int registerUpdateCallback(OnRemoteSpanUpdatedCallback callback) {
    synchronized (updateCallbacks) {
      int callbackId = nextCallbackId++;
      updateCallbacks.put(callbackId, callback);
      return callbackId;
    }
  }

  @Nullable
  private OnRemoteSpanUpdatedCallback takeUpdateCallback(int callbackId) {
    synchronized (updateCallbacks) {
      int index = updateCallbacks.indexOfKey(callbackId);
      if (index < 0) {
        return null;
      }

      OnRemoteSpanUpdatedCallback callback = updateCallbacks.valueAt(index);
      updateCallbacks.removeAt(index);
      return callback;
    }
  }

  private static void endSpan(ReadableMap updates, Span span) {
    if (updates.hasKey(END_TIME)) {
      double endTime = updates.getDouble(END_TIME);
      span.end(BugsnagClock.INSTANCE.unixNanoTimeToElapsedRealtime((long) endTime));
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
