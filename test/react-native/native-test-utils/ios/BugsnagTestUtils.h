#import <Foundation/Foundation.h>
#import "BSGViewController.h"

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
+ (NSDictionary * _Nullable)readStartupConfig;

/**
 * Save the provided configuration for use on the next launch.
 * 
 * @param configuration Configuration dictionary to save
 */ 
+ (void)saveStartupConfig:(NSDictionary * _Nonnull)configuration;

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
+ (BOOL)startNativePerformanceWithConfiguration:(NSDictionary * _Nonnull)configuration;

@end

NS_ASSUME_NONNULL_END