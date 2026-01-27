package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.Nullable;

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

import com.bugsnag.reactnative.performance.AppStartProvider;
import com.bugsnag.reactnative.performance.AppStartRegistry;

import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicBoolean;

public class BugsnagReactNativeAppStartPlugin implements Plugin, AppStartProvider {

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

  private final AtomicReference<ViewLoadCondition> viewLoadCondition = new AtomicReference<>(null);
  private volatile boolean appStartComplete = false;
  private final long spanBlockTimeoutMs;

  public BugsnagReactNativeAppStartPlugin() {
    this(DEFAULT_SPAN_BLOCK_TIMEOUT_MS);
  }

  public BugsnagReactNativeAppStartPlugin(long timeoutMs) {
    this.spanBlockTimeoutMs = timeoutMs;
  }

  @Override
  public void install(PluginContext ctx) {
    // Register this plugin as the AppStartProvider with the core React Native Performance module
    AppStartRegistry.register(this);

    ctx.addOnSpanStartCallback(PluginContext.NORM_PRIORITY + 1, new OnSpanStartCallback() {
      @Override
      public void onSpanStart(Span span) {
        BugsnagReactNativeAppStartPlugin.this.onSpanStart(span);
      }
    });

    ctx.addOnSpanEndCallback(PluginContext.NORM_PRIORITY - 1, new OnSpanEndCallback() {
      @Override
      public boolean onSpanEnd(Span span) {
        return BugsnagReactNativeAppStartPlugin.this.onSpanEnd(span);
      }
    });
  }

  @Override
  public void start() {}

  @Nullable
  @Override
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

  @Override
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
