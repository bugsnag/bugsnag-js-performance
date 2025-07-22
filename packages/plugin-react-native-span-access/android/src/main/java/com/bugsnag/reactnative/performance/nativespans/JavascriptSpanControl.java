package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.NonNull;

public interface JavascriptSpanControl {
  JavascriptSpanTransaction createUpdateTransaction();

  /**
   * Request the {@code SpanContext} data represented by the named span. If the span is not currently open,
   * is not available or the app is not connected: the callback will be invoked with a {@code null} value.
   *
   * @param callback the callback that should recieve the remote {@code SpanContext}
   */
  void retrieveSpanContext(@NonNull OnSpanContextRetrievedCallback callback);
}
