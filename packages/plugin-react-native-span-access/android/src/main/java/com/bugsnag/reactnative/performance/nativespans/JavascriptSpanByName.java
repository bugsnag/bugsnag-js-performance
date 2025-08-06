package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.NonNull;

import com.bugsnag.android.performance.controls.SpanQuery;

public final class JavascriptSpanByName implements SpanQuery<JavascriptSpanControl> {
  private final String name;

  public JavascriptSpanByName(@NonNull String name) {
    if (name == null) {
      throw new IllegalArgumentException("Span name cannot be null");
    }

    this.name = name;
  }

  public String getSpanName() {
    return name;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof JavascriptSpanByName)) return false;
    return this.name.equals(((JavascriptSpanByName) o).name);
  }

  @Override
  public int hashCode() {
    return this.name.hashCode();
  }

  @Override
  public String toString() {
    return "JavascriptSpanByName{name='" + name + "'}";
  }
}
