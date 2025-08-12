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

public class BugsnagNativeSpansPlugin implements Plugin {
    /**
     * Default 10 minute validity time
     */
    private static final long DEFAULT_VALIDITY_TIME = 10 * 60 * 1000;

    private static BugsnagNativeSpansPlugin INSTANCE;

    private final ConcurrentMap<String, Span> spansByName = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Span> spansById = new ConcurrentHashMap<>();

    @Override
    public void install(PluginContext ctx) {
        if (INSTANCE == null) {
            INSTANCE = this;
        }

        ctx.addOnSpanStartCallback(PluginContext.NORM_PRIORITY + 1, new OnSpanStartCallback() {
            @Override
            public void onSpanStart(Span span) {
              BugsnagNativeSpansPlugin.this.onSpanStart(span);
            }
        });

        ctx.addOnSpanEndCallback(PluginContext.NORM_PRIORITY - 1, new OnSpanEndCallback() {
            @Override
            public boolean onSpanEnd(Span span) {
                return BugsnagNativeSpansPlugin.this.onSpanEnd(span);
            }
        });
    }

    private void onSpanStart(Span span) {
        spansByName.put(span.getName(), span);
        spansById.put(createSpanId(span), span);

        TimeoutExecutor timeoutExecutor = ((SpanImpl) span).getTimeoutExecutor$internal();
        if (timeoutExecutor != null) {
            timeoutExecutor.scheduleTimeout(new SpanLostTimeout(DEFAULT_VALIDITY_TIME, span));
        }
    }

    private boolean onSpanEnd(Span span) {
        spansByName.remove(span.getName(), span);
        spansById.remove(createSpanId(span));
        return true;
    }

    private void removeSpan(Span span) {
        onSpanEnd(span);
    }

    private String createSpanId(Span span) {
        StringBuilder id = new StringBuilder(193);
        EncodingUtils.appendHexUUID(id, span.getTraceId());
        id.append(':');
        EncodingUtils.appendHexLong(id, span.getSpanId());
        return id.toString();
    }

    @Override
    public void start() {
    }

    Span getSpanByName(String spanName) {
        return spansByName.get(spanName);
    }

    Span getSpanById(String traceIdHex, String spanIdHex) {
        return spansById.get(traceIdHex + ':' + spanIdHex);
    }

    static BugsnagNativeSpansPlugin getInstance() {
        return INSTANCE;
    }

    private class SpanLostTimeout implements Timeout {
        private final long timeoutMs;
        private final Span span;

        public SpanLostTimeout(long timeoutMs, Span span) {
            this.timeoutMs = SystemClock.elapsedRealtime() + timeoutMs;
            this.span = span;
        }

        @Override
        public long getTarget() {
            return timeoutMs;
        }

        @Override
        public void run() {
            removeSpan(span);
        }

        @Override
        public long getRelativeMs() {
            return Timeout.DefaultImpls.getRelativeMs(this);
        }

        @Override
        public long getDelay(TimeUnit unit) {
            return Timeout.DefaultImpls.getDelay(this, unit);
        }

        @Override
        public int compareTo(Delayed other) {
            return Timeout.DefaultImpls.compareTo(this, other);
        }
    }
}
