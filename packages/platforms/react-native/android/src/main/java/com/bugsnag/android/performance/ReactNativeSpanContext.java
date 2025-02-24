package com.bugsnag.reactnative.performance;

import androidx.annotation.NonNull;
import com.bugsnag.android.performance.SpanContext;
import java.util.UUID;
import java.util.concurrent.Callable;

class ReactNativeSpanContext implements SpanContext {
  private static final int HEX_RADIX = 16;
  private static final int TRACE_ID_MIDPOINT = 16;

  private final long nativeSpanId;
  private final UUID nativeTraceId;
  
  ReactNativeSpanContext(String spanId, String traceId) {
    nativeSpanId = Long.parseUnsignedLong(spanId, HEX_RADIX);
    nativeTraceId = new UUID(
      Long.parseUnsignedLong(traceId.substring(0, TRACE_ID_MIDPOINT), HEX_RADIX),
      Long.parseUnsignedLong(traceId.substring(TRACE_ID_MIDPOINT), HEX_RADIX)
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
