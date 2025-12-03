package com.bugsnag.reactnative.performance;

import androidx.annotation.Nullable;

/**
 * Registry for managing the AppStartProvider instance.
 * This allows the optional plugin-react-native-span-access package to register itself
 * without creating a circular dependency.
 */
public final class AppStartRegistry {

  private static volatile AppStartProvider instance;

  private AppStartRegistry() {
    // Prevent instantiation
  }

  /**
   * Registers an AppStartProvider to handle app start span operations.
   * This should be called by the BugsnagReactNativeAppStartPlugin during its install phase.
   * @param provider the provider to register, or null to unregister
   */
  public static void register(@Nullable AppStartProvider provider) {
    instance = provider;
  }

  /**
   * Gets the currently registered provider, or null if none is registered.
   * @return the registered provider, or null
   */
  @Nullable
  public static AppStartProvider get() {
    return instance;
  }
}
