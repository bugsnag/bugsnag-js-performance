package com.bugsnag.reactnative.performance.nativespans;

class JavascriptSpanControlImpl implements JavascriptSpanControl {
  private final String spanName;

  JavascriptSpanControlImpl(String spanName) {
    this.spanName = spanName;
  }

  @Override
  public JavascriptSpanTransaction createUpdateTransaction() {
    return new JavascriptSpanTransactionImpl(spanName);
  }
}
