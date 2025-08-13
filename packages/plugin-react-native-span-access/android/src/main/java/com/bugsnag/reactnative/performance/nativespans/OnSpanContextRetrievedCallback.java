package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.Nullable;

import com.bugsnag.android.performance.SpanContext;

public interface OnSpanContextRetrievedCallback {
  /**
   * Called with the retrieved remote {@link SpanContext} or {@code null} if the context could not be retrieved.
   *
   * @param remoteSpanContext the remote {@link SpanContext} that was requested (or {@code null})
   */
  void onSpanContextRetrieved(@Nullable SpanContext remoteSpanContext);
}
