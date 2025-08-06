package com.bugsnag.reactnative.performance.nativespans;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.LinkedHashMap;
import java.util.Collection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.bugsnag.android.performance.internal.BugsnagClock;

class JavascriptSpanTransactionImpl implements JavascriptSpanTransaction {

  static final String ID = "id";
  static final String NAME = "name";
  static final String VALUE = "value";
  static final String ATTRIBUTES = "attributes";
  static final String END_TIME = "endTime";
  static final String IS_ENDED = "isEnded";

  private final String spanName;

  private final LinkedHashMap<String, Object> attributes = new LinkedHashMap<>();

  private boolean isEnded = false;
  private long endTime = -1L;
  private boolean isOpen = true;

  JavascriptSpanTransactionImpl(String spanName) {
    this.spanName = spanName;
  }

  @Override
  public JavascriptSpanTransaction end() {
    return end(-1L);
  }

  @Override
  public JavascriptSpanTransaction end(long endTime) {
    if (!isOpen) {
      return this;
    }

    this.isEnded = true;
    this.endTime = endTime >= 0
            ? BugsnagClock.INSTANCE.elapsedNanosToUnixTime(endTime)
            : BugsnagClock.INSTANCE.currentUnixNanoTime();
    return this;
  }

  @Override
  public JavascriptSpanTransaction setAttribute(String key, Object value) {
    if (!isOpen) {
      return this;
    }

    attributes.remove(key); // Remove any existing attribute, moving the value to the end
    attributes.put(key, value);
    return this;
  }

  @Override
  public void commit(OnRemoteSpanUpdatedCallback callback) {
    if (!isOpen) {
      if (callback != null) callback.onRemoteSpanUpdated(false);
      return;
    }

    isOpen = false;

    BugsnagNativeSpans spans = BugsnagNativeSpans.getInstance();
    if (spans == null) {
      if (callback != null) callback.onRemoteSpanUpdated(false);
      return;
    }

    WritableMap updateTransaction = Arguments.createMap();
    updateTransaction.putString(NAME, spanName);

    Set<Map.Entry<String, Object>> entries = attributes.entrySet();
    WritableArray attributesArray = Arguments.createArray();
    for (Map.Entry<String, Object> entry : entries) {
      try {
        WritableMap attributeMap = Arguments.createMap();
        attributeMap.putString(NAME, entry.getKey());
        Object value = entry.getValue();

        if (value instanceof String) {
          attributeMap.putString(VALUE, (String) value);
        } else if (value instanceof Integer) {
          attributeMap.putInt(VALUE, (Integer) value);
        } else if (value instanceof Number) {
          attributeMap.putDouble(VALUE, ((Number) value).doubleValue());
        } else if (value instanceof Boolean) {
          attributeMap.putBoolean(VALUE, (Boolean) value);
        } else if (value instanceof int[] ||
          value instanceof long[] ||
          value instanceof float[] ||
          value instanceof double[] ||
          value instanceof Integer[] ||
          value instanceof Long[] ||
          value instanceof Float[] ||
          value instanceof Double[] ||
          value instanceof String[] ||
          value instanceof boolean[] ||
          value instanceof Boolean[]
        ) {
          attributeMap.putArray(VALUE, Arguments.makeNativeArray(value));
        } else if (value instanceof List) {
          attributeMap.putArray(VALUE, Arguments.makeNativeArray((List<?>) value));
        } else if (value instanceof Collection) {
          attributeMap.putArray(
            VALUE,
            Arguments.makeNativeArray(new ArrayList<>((Collection<?>) value))
          );
        }

        attributesArray.pushMap(attributeMap);
      } catch (Exception e) {
        // If we can't convert the value to a supported type, skip it
        continue;
      }
    }

    updateTransaction.putArray(ATTRIBUTES, attributesArray);

    if (isEnded) {
      updateTransaction.putDouble(END_TIME, endTime);
      updateTransaction.putBoolean(IS_ENDED, true);
    }

    int callbackId = -1;
    if (callback != null) {
      // register the callback *last* to avoid memory leaks from earlier exceptions
      callbackId = spans.registerUpdateCallback(callback);
      updateTransaction.putInt(ID, callbackId);
    }

    if (!spans.emitSpanUpdateEvent(updateTransaction) && callback != null) {
      // If the event could not be emitted, notify the callback with a failure
      callback.onRemoteSpanUpdated(false);

      if (callbackId >= 0) {
        // If we registered a callback, unregister it
        spans.takeUpdateCallback(callbackId);
      }
    }
  }
}
