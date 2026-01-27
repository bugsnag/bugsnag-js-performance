package com.bugsnag.reactnative.performance;

import android.annotation.SuppressLint;

import com.bugsnag.android.performance.internal.Attributes;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

@SuppressLint("RestrictedApi")
public class ReactNativeSpanAttributes {

  private static final long[] EMPTY_ARRAY = new long[0];

  private ReactNativeSpanAttributes() {}

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
      attributes.set(name, EMPTY_ARRAY);
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

  public static Object transformArray(ReadableArray value) {
    int size = value.size();
    if (size == 0) {
      return EMPTY_ARRAY;
    }

    // we assume that array values are all of the same type
    switch (value.getType(0)) {
      case String:
        return getStringArray(value);
      case Number:
        long[] ints = getLongArray(value);
        if (ints == null) {
          return getDoubleArray(value);
        } else {
          return ints;
        }
    }

    return EMPTY_ARRAY;
  }

  /**
   * Attempt to read an array of numbers as longs, returns null if any number cannot be expressed as a long.
   * @return the long[] or null
   */
  public static long[] getLongArray(ReadableArray jsNumberArray) {
    int size = jsNumberArray.size();
    long[] longValues = new long[size];
    for (int i = 0; i < size; i++) {
      double arrayValue = jsNumberArray.getDouble(i);
      if (arrayValue % 1 != 0) {
        return null;
      }
      longValues[i] = (long)arrayValue;
    }

    return longValues;
  }

  public static double[] getDoubleArray(ReadableArray jsNumberArray) {
    int size = jsNumberArray.size();
    double[] doubleValues = new double[size];
    for (int i = 0; i < size; i++) {
      doubleValues[i] = jsNumberArray.getDouble(i);
    }
    return doubleValues;
  }

  public static String[] getStringArray(ReadableArray jsStringArray) {
    int size = jsStringArray.size();
    String[] stringArray = new String[size];
    for (int i = 0; i < size; i++) {
      stringArray[i] = jsStringArray.getString(i);
    }
    return stringArray;
  }

  private static void setStringArrayAttribute(Attributes attributes, String name, ReadableArray jsStringArray) {
    attributes.set(name, getStringArray(jsStringArray));
  }

  private static void setNumberArrayAttribute(Attributes attributes, String name, ReadableArray jsNumberArray) {
    long[] longValues = getLongArray(jsNumberArray);

    if (longValues != null) {
      attributes.set(name, longValues);
      return;
    }

    attributes.set(name, getDoubleArray(jsNumberArray));
  }
}
