package com.bugsnag.reactnative.performance.nativespans;

import com.bugsnag.android.performance.Span;
import com.bugsnag.android.performance.OnSpanEndCallback;
import com.bugsnag.android.performance.OnSpanStartCallback;
import com.bugsnag.android.performance.Plugin;
import com.bugsnag.android.performance.PluginContext;
import com.bugsnag.android.performance.internal.EncodingUtils;
import com.bugsnag.android.performance.internal.SpanImpl;
import com.bugsnag.android.performance.internal.processing.Timeout;
import com.bugsnag.android.performance.internal.processing.TimeoutExecutor;

import android.os.SystemClock;

import java.util.UUID;
import java.util.concurrent.Delayed;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentHashMap;

public class BugsnagJavascriptSpansPlugin implements Plugin {

  @Override
  public void install(PluginContext ctx) {
    ctx.addSpanControlProvider(new JavascriptSpanControlProvider());
  }

  @Override
  public void start() {
  }

}
