package com.bugsnag.reactnative.performance;

import com.bugsnag.android.performance.Span;
import com.bugsnag.android.performance.SpanContext;
import com.bugsnag.android.performance.OnSpanEndCallback;
import com.bugsnag.android.performance.OnSpanStartCallback;
import com.bugsnag.android.performance.Plugin;
import com.bugsnag.android.performance.PluginContext;
import com.bugsnag.android.performance.RemoteSpanContext;

import com.bugsnag.android.performance.internal.SpanImpl.Condition;
import com.bugsnag.android.performance.internal.SpanCategory;
import com.bugsnag.android.performance.internal.SpanImpl;

import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicBoolean;

public class ReactNativeAppStartPlugin implements Plugin {

  private static final long DEFAULT_SPAN_BLOCK_TIMEOUT_MS = 5000;

  // Container class to ensure atomic updates of related fields
  private static class ViewLoadCondition {
    final String spanId;
    final Condition condition;

    ViewLoadCondition(String spanId, Condition condition) {
      this.spanId = spanId;
      this.condition = condition;
    }
  }

  private static ReactNativeAppStartPlugin INSTANCE;

  private final AtomicReference<ViewLoadCondition> viewLoadCondition = new AtomicReference<>(null);
  private volatile boolean appStartComplete = false;
  private final long spanBlockTimeoutMs;

  public ReactNativeAppStartPlugin() {
    this(DEFAULT_SPAN_BLOCK_TIMEOUT_MS);
  }

  public ReactNativeAppStartPlugin(long timeoutMs) {
    this.spanBlockTimeoutMs = timeoutMs;
  }

  static ReactNativeAppStartPlugin getInstance() {
    return INSTANCE;
  }

  @Override
  public void install(PluginContext ctx) {
    if (INSTANCE == null) {
      INSTANCE = this;
    }

    ctx.addOnSpanStartCallback(PluginContext.NORM_PRIORITY + 1, new OnSpanStartCallback() {
      @Override
      public void onSpanStart(Span span) {
        ReactNativeAppStartPlugin.this.onSpanStart(span);
      }
    });

    ctx.addOnSpanEndCallback(PluginContext.NORM_PRIORITY - 1, new OnSpanEndCallback() {
      @Override
      public boolean onSpanEnd(Span span) {
        return ReactNativeAppStartPlugin.this.onSpanEnd(span);
      }
    });
  }

  @Override
  public void start() {}

  public String getAppStartParent() {
    ViewLoadCondition currentCondition = viewLoadCondition.get();
    if (currentCondition != null) {
      SpanContext nativeParent = currentCondition.condition.upgrade();
      if (nativeParent != null) {
        return RemoteSpanContext.encodeAsTraceParent(nativeParent);
      }
    }

    return null;
  }

  public void endAppStart(long endTime) {
    ViewLoadCondition currentCondition = viewLoadCondition.getAndSet(null);
    if (currentCondition != null) {
      currentCondition.condition.close(endTime);
    }

    appStartComplete = true;
  }

  private void onSpanStart(Span span) {
    if (appStartComplete) {
      return;
    }

    SpanImpl spanImpl = (SpanImpl)span;
    if (spanImpl.getAttributes().get("bugsnag.span.category") != SpanCategory.CATEGORY_VIEW_LOAD) {
      return;
    }

    ViewLoadCondition currentCondition = viewLoadCondition.get();
    if (currentCondition != null) {
      currentCondition.condition.cancel();
    }

    // Only set viewLoadCondition if block() returned a non-null value
    Condition spanCondition = spanImpl.block(spanBlockTimeoutMs);
    if (spanCondition != null) {
      String spanId = RemoteSpanContext.encodeAsTraceParent(spanImpl);
      viewLoadCondition.set(new ViewLoadCondition(spanId, spanCondition));
    }
  }

  private boolean onSpanEnd(Span span) {
    String spanId = RemoteSpanContext.encodeAsTraceParent(span);
    ViewLoadCondition currentCondition = viewLoadCondition.get();

    if (currentCondition != null && spanId.equals(currentCondition.spanId)) {
      if (viewLoadCondition.compareAndSet(currentCondition, null)) {
        currentCondition.condition.cancel();
      }
    }

    return true;
  }
}
