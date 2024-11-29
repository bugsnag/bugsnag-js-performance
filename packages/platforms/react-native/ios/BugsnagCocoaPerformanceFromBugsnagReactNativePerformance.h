#import <Foundation/Foundation.h>
#import "BugsnagPerformanceConfiguration.h"
#import "BugsnagPerformanceSpan.h"
#import "BugsnagPerformanceSpanOptions.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Bridge from Bugsnag React Native Performance to Bugsnag Cocoa Performance.
 *
 * IMPORTANT: This class name MUST be globally unique across ALL Bugsnag libraries that contain native code!
 * When cloning this code as a template for your own bridge, always use the naming style "YourLibraryFromMyLibrary"
 * For example:
 * * "BugsnagCocoaPerformanceFromBugsnagUnity" (bridge from Bugsnag Unity to Bugsnag Cocoa Performance)
 * * "BugsnagCocoaFromBugsnagReactNativePerformance" (bridge from Bugsnag Performance React Native to Bugsnag Cocoa)
 */
@interface BugsnagCocoaPerformanceFromBugsnagReactNativePerformance: NSObject

#pragma mark Methods that will be bridged to BugsnagPerformance

- (BugsnagPerformanceConfiguration * _Nullable)getConfiguration;

- (BugsnagPerformanceSpan * _Nullable)startSpan:(NSString *)name options:(BugsnagPerformanceSpanOptions *)options;

#pragma mark Shared Instance

+ (instancetype _Nullable) sharedInstance;

@end

NS_ASSUME_NONNULL_END
