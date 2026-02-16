#import <Foundation/Foundation.h>
#import "BugsnagPerformanceAppStartProvider.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry for managing the AppStartProvider instance.
 * This allows the optional plugin-react-native-span-access package to register itself
 * without creating a circular dependency or linker error.
 */
@interface BugsnagPerformanceAppStartRegistry : NSObject

/**
 * Registers an AppStartProvider to handle app start span operations.
 * This should be called by the BugsnagReactNativeAppStartPlugin during its install phase.
 * @param provider the provider to register, or nil to unregister
 */
+ (void)registerProvider:(nullable id<BugsnagPerformanceAppStartProvider>)provider;

/**
 * Gets the currently registered provider, or nil if none is registered.
 * @return the registered provider, or nil
 */
+ (nullable id<BugsnagPerformanceAppStartProvider>)provider;

@end

NS_ASSUME_NONNULL_END
