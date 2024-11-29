#import <Foundation/Foundation.h>
#import "BugsnagCocoaPerformanceFromBugsnagReactNativePerformance.h"

// Bridged API methods won't have implementations until we connect them at runtime.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wincomplete-implementation"

@implementation BugsnagCocoaPerformanceFromBugsnagReactNativePerformance

static NSString *BSGUserInfoKeyMapped = @"mapped";
static NSString *BSGUserInfoValueMappedYes = @"YES";

static id bugsnagPerformanceCrossTalkAPI = nil;

+ (void)initialize {
    // Look for a cross-talk API
    Class cls = NSClassFromString(@"BugsnagPerformanceCrossTalkAPI");
    if (cls != nil) {
        NSError *err = nil;
        // Map the methods we want to use, with the API versions we expect
        if ((err = [cls mapAPINamed:@"getConfigurationV1"
                         toSelector:@selector(getConfiguration)]) != nil) {
            NSLog(@"Failed to map Bugsnag Performance API getConfigurationV1: %@", err);
            NSString *mapped = err.userInfo[BSGUserInfoKeyMapped];
            if (![mapped isEqualToString:BSGUserInfoValueMappedYes]) {
                // Must abort because this method is not mapped, so we'd crash if we tried to call it.
                return;
            }
        }

        if ((err = [cls mapAPINamed:@"startSpanV1"
                         toSelector:@selector(startSpan:options:)]) != nil) {
            NSLog(@"Failed to map Bugsnag Performance API startSpanV1: %@", err);
            NSString *mapped = err.userInfo[BSGUserInfoKeyMapped];
            if (![mapped isEqualToString:BSGUserInfoValueMappedYes]) {
                // Must abort because this method is not mapped, so we'd crash if we tried to call it.
                return;
            }
        }

        // Our "sharedInstance" will actually be the cross-talk API whose class we loaded.
        bugsnagPerformanceCrossTalkAPI = [cls sharedInstance];
    }
}

+ (instancetype _Nullable) sharedInstance {
    // We're either going to return the API object we found in +initialize, or nil.
    return bugsnagPerformanceCrossTalkAPI;
}

/**
 * Map a named API to a method with the specified selector.
 * If an error occurs, the user info dictionary of the error will contain a field "mapped".
 * If "mapped" is "YES", then the selector has been mapped to a null implementation (does nothing, returns nil).
 * If "mapped" is "NO", then no mapping has occurred, and the method doesn't exist (alling it will result in no such selector).
 */
+ (NSError *)mapAPINamed:(NSString * _Nonnull __unused)apiName toSelector:(SEL __unused)toSelector {
    // This exists only to make the mapAPINamed selector available on our side
    // so that we can call it on the API class we found (see +initialize).
    // This implementation is never actually called.
    return nil;
}

@end
#pragma clang diagnostic pop