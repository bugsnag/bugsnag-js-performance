#import <Foundation/Foundation.h>
#import "BugsnagReactNativePerformanceCrossTalkAPIClient.h"

// Bridged API methods won't have implementations until we connect them at runtime.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wincomplete-implementation"

@implementation BugsnagReactNativePerformanceCrossTalkAPIClient

static NSString *hostApiClassName = @"BugsnagPerformanceCrossTalkAPI";
static id hostCrossTalkAPI = nil;
static BOOL initialized = false;

+ (void)initialize {
    // Fetch the CrossTalk API using its Objective-C class name
    Class cls = NSClassFromString(hostApiClassName);
    hostCrossTalkAPI = [cls sharedInstance];
    
    // Map the methods we want to use, with the API versions we expect
    NSError *err = [self mapAPINamed:@"getConfigurationV1" toSelector:@selector(getConfiguration)];
    if (err != nil) {
        return;
    }
    
    err = [self mapAPINamed:@"startSpanV1:options:" toSelector:@selector(startSpan:options:)];
    if (err != nil) {
        return;
    }
    
    err = [self mapAPINamed:@"newSpanOptionsV1" toSelector:@selector(newSpanOptions)];
    if (err != nil) {
        return;
    }
    
    err = [self mapAPINamed:@"newSpanContextV1:traceIdLo:spanId:" toSelector:@selector(newSpanContext:traceIdLo:spanId:)];
    if (err != nil) {
        return;
    }
    
    // All required API methods are mapped
    initialized = YES;
}

+ (instancetype _Nullable)sharedInstance {
    return hostCrossTalkAPI;
}

+ (BOOL)isInitialized {
    return initialized;
}

static NSString *userInfoKeyIsSafeToCall = @"isSafeToCall";
static NSString *userInfoKeyWillNOOP = @"willNOOP";

+ (NSError *)mapAPINamed:(NSString * _Nonnull)apiName toSelector:(SEL)toSelector {
    if (hostCrossTalkAPI == nil) {
        return [NSError errorWithDomain:@"com.bugsnag.CrossTalk"
                                   code:0
                               userInfo:@{
            NSLocalizedDescriptionKey:[NSString stringWithFormat:@"API class not found: %@", hostApiClassName],
            userInfoKeyIsSafeToCall:@YES,
            userInfoKeyWillNOOP:@YES
         }];
    }
    // [mapAPINamed: toSelector:] is implemented in the host CrossTalk API
    return [[hostCrossTalkAPI class] mapAPINamed:apiName toSelector:toSelector];
}

@end
#pragma clang diagnostic pop
