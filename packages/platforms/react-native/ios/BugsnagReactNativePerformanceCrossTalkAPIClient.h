#import <Foundation/Foundation.h>
#import "BugsnagPerformanceConfiguration.h"
#import "BugsnagPerformanceSpan.h"
#import "BugsnagPerformanceSpanOptions.h"
#import "BugsnagPerformanceSpanContext.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Bridge from Bugsnag React Native Performance to Bugsnag Cocoa Performance.
 *
 * IMPORTANT: This class name MUST be globally unique across ALL Bugsnag libraries that contain native code!
 */
@interface BugsnagReactNativePerformanceCrossTalkAPIClient: NSObject

#pragma mark APIs that all CrossTalk clients must implement

/**
 * This will be automatically called by the Objective-C runtime.
 */
+ (void)initialize;

/**
 * Get the shared instance. This will be nil if the host CrossTalk API wasn't found.
 */
+ (instancetype _Nullable)sharedInstance;

/**
 * Map a named API to a method with the specified selector.
 *
 * If an error occurs, the user info dictionary will contain the following NSNumber (boolean) fields:
 *  - "isSafeToCall": If @(YES), this method is safe to call (it has an implementation). Otherwise, calling it WILL throw a selector-not-found exception.
 *  - "willNOOP": If @(YES), calling the mapped method will no-op.
 *
 * Common scenarios:
 *  - The host library isn't linked in: isSafeToCall = YES, willNOOP = YES
 *  - apiName doesn't exist: isSafeToCall = YES, willNOOP = YES
 *  - toSelector already exists: isSafeToCall = YES, willNOOP = NO
 *  - Tried to map the same thing twice: isSafeToCall = YES, willNOOP = NO
 *  - Selector signature clash: isSafeToCall = NO, willNOOP = NO
 */
+ (NSError *)mapAPINamed:(NSString * _Nonnull)apiName toSelector:(SEL)toSelector;

#pragma mark Mapped API Methods that we'll be using

- (BugsnagPerformanceConfiguration * _Nullable)getConfiguration;

- (BugsnagPerformanceSpan * _Nullable)startSpan:(NSString *)name options:(BugsnagPerformanceSpanOptions *)options;

- (BugsnagPerformanceSpanOptions *)newSpanOptions;

- (BugsnagPerformanceSpanContext *)newSpanContext:(uint64_t)traceIdHi traceIdLo:(uint64_t)traceIdLo spanId:(SpanId)spanId;

#pragma mark APIs specific to this client

/**
 * Indicate whether the client has initialized successfully. This will be YES only if all API methods were mapped successfully.
 */
+ (BOOL)isInitialized;

@end

NS_ASSUME_NONNULL_END
