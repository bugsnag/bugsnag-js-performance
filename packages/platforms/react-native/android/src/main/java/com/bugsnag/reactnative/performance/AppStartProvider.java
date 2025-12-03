package com.bugsnag.reactnative.performance;

import androidx.annotation.Nullable;

/**
 * Interface for providing app start span context and handling app start completion.
 * This allows the optional plugin-react-native-span-access package to register itself
 * without creating a circular dependency.
 */
public interface AppStartProvider {
  /**
   * Returns the app start parent context as a trace parent string, or null if not available.
   */
  @Nullable
  String getAppStartParent();

  /**
   * Ends the app start span at the specified time.
   * @param endTime the end time in elapsed realtime nanos
   */
  void endAppStart(long endTime);
}
