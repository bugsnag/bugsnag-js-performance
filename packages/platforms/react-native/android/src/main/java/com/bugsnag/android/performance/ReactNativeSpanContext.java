package com.bugsnag.reactnative.performance;

import androidx.annotation.NonNull;
import com.bugsnag.android.performance.SpanContext;
import java.util.UUID;
import java.util.concurrent.Callable;

class ReactNativeSpanContext implements SpanContext {
  private final long nativeSpanId;
  private final UUID nativeTraceId;

  public ReactNativeSpanContext(String spanId, String traceId) {
    nativeSpanId = Long.parseUnsignedLong(spanId, 16);
    nativeTraceId = new UUID(
      Long.parseUnsignedLong(traceId.substring(0, 16), 16),
      Long.parseUnsignedLong(traceId.substring(16), 16)
    );
  }

  @Override
  public long getSpanId() {
    return nativeSpanId;
  }

  @NonNull
  @Override
  public UUID getTraceId() {
    return nativeTraceId;
  }

  @NonNull
  @Override
  public Runnable wrap(@NonNull Runnable runnable) {
    return SpanContext.DefaultImpls.wrap(this, runnable);
  }

  @NonNull
  @Override
  public <T> Callable<T> wrap(@NonNull Callable<T> callable) {
    return SpanContext.DefaultImpls.wrap(this, callable);
  }
}
