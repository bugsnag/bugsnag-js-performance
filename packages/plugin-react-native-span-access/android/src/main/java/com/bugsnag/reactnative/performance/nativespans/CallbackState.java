package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import android.util.SparseArray;

class CallbackState<T> {
  private final SparseArray<T> callbacks = new SparseArray<>(4);
  private int nextCallbackId = 0;

  int registerCallback(@NonNull T callback) {
    synchronized (callbacks) {
      int callbackId = nextCallbackId++;
      callbacks.put(callbackId, callback);
      return callbackId;
    }
  }

  T takeCallback(int callbackId) {
    synchronized (callbacks) {
      int index = callbacks.indexOfKey(callbackId);
      if (index < 0) {
        return null;
      }

      T callback = callbacks.valueAt(index);
      callbacks.removeAt(index);
      return callback;
    }
  }
}
