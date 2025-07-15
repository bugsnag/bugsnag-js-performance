package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.Nullable;
import androidx.annotation.NonNull;

import com.bugsnag.android.performance.controls.SpanQuery;
import com.bugsnag.android.performance.controls.SpanControlProvider;

class JavascriptSpanControlProvider implements SpanControlProvider<JavascriptSpanControl> {
  @Nullable
  @Override
  public <Q extends SpanQuery<? extends JavascriptSpanControl>> JavascriptSpanControl get(@NonNull Q query) {
    if (query instanceof JavascriptSpanByName) {
      String spanName = ((JavascriptSpanByName) query).getSpanName();
      return new JavascriptSpanControlImpl(spanName);
    }
    return null;
  }
}
