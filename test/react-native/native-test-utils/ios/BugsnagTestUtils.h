#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagTestUtils : NSObject

/**
 * Starts native performance if a startup configuration has been saved.
 * This method reads the saved configuration and starts native performance if one exists.
 */
+ (void)startNativePerformanceIfConfigured;

/**
 * Get the startup configuration from a previous launch.
 * 
 * @return NSDictionary containing the startup configuration, or nil if no configuration is saved
 */
+ (nullable NSDictionary *)readStartupConfig;

/**
 * Save the provided configuration for use on the next launch.
 * 
 * @param configuration Configuration dictionary to save
 */ 
+ (void)saveStartupConfig:(NSDictionary *)configuration;

/**
 * Clear any saved startup configuration.
 */
+ (void)clearStartupConfig;

/**
 * Starts the native Bugsnag Performance SDK with the provided configuration.
 * 
 * @param configuration Configuration dictionary containing performance settings
 * @return YES if started successfully, NO otherwise
 */
+ (BOOL)startNativePerformanceWithConfiguration:(NSDictionary *)configuration;

@end

NS_ASSUME_NONNULL_END