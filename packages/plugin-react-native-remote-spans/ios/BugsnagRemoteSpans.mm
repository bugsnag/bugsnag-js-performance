#import <BugsnagPerformance/BugsnagPerformanceSpan.h>

#import "BugsnagRemoteSpans.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "BugsnagRemoteSpansSpec.h"
#endif

#import "BugsnagRemoteSpansPlugin+Private.h"

@implementation BugsnagRemoteSpans

RCT_EXPORT_MODULE()

static void endSpan(NSDictionary *updates, BugsnagPerformanceSpan *span) {
    NSNumber *timestampString = updates[@"endTime"];
    if (timestampString) {
        double endTimestampValue = [timestampString doubleValue];
        NSDate *endTimestamp = [NSDate dateWithTimeIntervalSince1970:(endTimestampValue / NSEC_PER_SEC)];
        [span endWithEndTime:endTimestamp];
    } else {
        [span end];
    }
}

static void updateSpanAttributes(NSArray *attributes, BugsnagPerformanceSpan *span) {
    for (NSDictionary *attribute in attributes) {
        NSString *name = attribute[@"name"];
        id value = attribute[@"value"];
        if (name) {
            [span setAttribute:name withValue:value];
        }
    }
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getSpanIdByName:(NSString *)spanName) {
    BugsnagRemoteSpansPlugin *plugin = [BugsnagRemoteSpansPlugin singleton];
    if (!plugin) {
        return nil;
    }

    BugsnagPerformanceSpan *span = nil;
    @synchronized (plugin) {
        span = plugin.spansByName[spanName];
    }

    if (!span) {
        return nil;
    }

    NSDictionary *returnedId = @{
        @"spanId": [NSString stringWithFormat:@"%016llx", span.spanId],
        @"traceId": [NSString stringWithFormat:@"%016llx%016llx", span.traceIdHi, span.traceIdLo]
    };

    return returnedId;
}

RCT_EXPORT_METHOD(updateSpan:(NSDictionary *)spanId
                     updates:(NSDictionary *)updates
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject)
{
    BugsnagRemoteSpansPlugin *plugin = [BugsnagRemoteSpansPlugin singleton];
    if (!plugin) {
        resolve(@NO);
        return;
    }

    NSString *id = spanId[@"spanId"];
    NSString *traceId = spanId[@"traceId"];

    if (!id || !traceId) {
        resolve(@NO);
        return;
    }

    NSString *spanIdKey = [NSString stringWithFormat:@"%@:%@", id, traceId];
    BugsnagPerformanceSpan *span = nil;
    @synchronized (plugin) {
        span = plugin.spansById[spanIdKey];
    }

    if (!span) {
        resolve(@NO);
        return;
    }

    NSArray *attributes = updates[@"attributes"];
    if (attributes) {
        updateSpanAttributes(attributes, span);
    }

    if (updates[@"isEnded"] == @YES) {
        endSpan(updates, span);
    }

    resolve(@YES);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr <facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBugsnagRemoteSpansSpecJSI>(params);
}
#endif

@end
