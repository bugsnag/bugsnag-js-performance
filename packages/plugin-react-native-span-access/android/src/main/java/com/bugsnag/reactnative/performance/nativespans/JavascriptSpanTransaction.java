package com.bugsnag.reactnative.performance.nativespans;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public interface JavascriptSpanTransaction {
    JavascriptSpanTransaction end();
    JavascriptSpanTransaction end(long endTime);

    JavascriptSpanTransaction setAttribute(@NonNull String key, @Nullable Object value);

    void commit(@Nullable OnRemoteSpanUpdatedCallback callback);
}
