package com.bugsnag.reactnative.performance;

import android.annotation.SuppressLint;

import com.bugsnag.android.performance.internal.Attributes;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

@SuppressLint("RestrictedApi")
public class ReactNativeSpanAttributes {

  public static void setAttributesFromReadableMap(Attributes attributes, ReadableMap jsAttributes) {
    ReadableMapKeySetIterator iterator = jsAttributes.keySetIterator();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      switch (jsAttributes.getType(key)) {
        case String:
          setAttribute(attributes, key, jsAttributes.getString(key));
          break;
        case Boolean:
          setAttribute(attributes, key, jsAttributes.getBoolean(key));
          break;
        case Number:
          setAttribute(attributes, key, jsAttributes.getDouble(key));
          break;
        case Array:
          setAttribute(attributes, key, jsAttributes.getArray(key));
          break;
        default:
          break;
      }
    }
  }

  private static void setAttribute(Attributes attributes, String name, String value) {
    attributes.set(name, value);
  }

  private static void setAttribute(Attributes attributes, String name, boolean value) {
    attributes.set(name, value);
  }

  private static void setAttribute(Attributes attributes, String name, double value) {
    if (value % 1 == 0) {
      attributes.set(name, (long)value);
    } else {
      attributes.set(name, value);
    }
  }

  private static void setAttribute(Attributes attributes, String name, ReadableArray value) {
    if (value == null) return;

    int size = value.size();
    if (size == 0) {
      attributes.set(name, new int[0]);
      return;
    }

    // we assume that array values are all of the same type
    switch (value.getType(0)) {
      case String:
        setStringArrayAttribute(attributes, name, value);
        break;
      case Number:
        setNumberArrayAttribute(attributes, name, value);
        break;
      default:
        break;
    }
  }

  private static void setStringArrayAttribute(Attributes attributes, String name, ReadableArray jsStringArray) {
    int size = jsStringArray.size();
    String[] stringArray = new String[size];
    for (int i = 0; i < size; i++) {
      stringArray[i] = jsStringArray.getString(i);
    }

    attributes.set(name, stringArray);
  }

  private static void setNumberArrayAttribute(Attributes attributes, String name, ReadableArray jsNumberArray) {
    int size = jsNumberArray.size();
    long[] longValues = new long[size];
    boolean containsDoubles = false;
    for (int i = 0; i < size; i++) {
        double arrayValue = jsNumberArray.getDouble(i);
        if (arrayValue % 1 != 0) {
            // If a non-integer value is found, we start again with a double[]
            containsDoubles = true;
            break;
        }
        longValues[i] = (long)arrayValue;
    }

    if (!containsDoubles) {
      attributes.set(name, longValues);
      return;
    }

    double[] doubleValues = new double[size];
    for (int i = 0; i < size; i++) {
      doubleValues[i] = jsNumberArray.getDouble(i);
    }

    attributes.set(name, doubleValues);
  }
}
