#import "BugsnagRemoteSpansPlugin+Private.h"
#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import <BugsnagPerformance/BugsnagPerformancePluginContext.h>

// generate a unique ID for the span based on its traceId and spanId
static NSString *createRemoteSpanId(BugsnagPerformanceSpan *span) {
    return [NSString stringWithFormat:@"%016llx:%016llx%016llx", span.spanId, span.traceIdHi, span.traceIdLo];
}

@implementation BugsnagRemoteSpansPlugin

static BugsnagRemoteSpansPlugin *_sharedInstance = nil;

+ (id)singleton {
    return _sharedInstance;
}

- (void)installWithContext:(BugsnagPerformancePluginContext *)context {
    _sharedInstance = self;
    _spansByName = [NSMutableDictionary new];
    _spansById = [NSMutableDictionary new];

    // add the spans to the caches when they are started
    __block BugsnagRemoteSpansPlugin *blockSelf = self;
    BugsnagPerformanceSpanStartCallback spanStartCallback = ^(BugsnagPerformanceSpan *span) {
        NSString *spanId = createRemoteSpanId(span);

        @synchronized (blockSelf) {
            blockSelf.spansByName[span.name] = span;
            blockSelf.spansById[spanId] = span;
        }
    };

    // remove the spans from the caches when they are ended
    BugsnagPerformanceSpanEndCallback spanEndCallback = ^(BugsnagPerformanceSpan *span) {
        NSString *spanId = createRemoteSpanId(span);

        @synchronized (blockSelf) {
            if ([blockSelf.spansByName objectForKey:span.name] == span) {
                [blockSelf.spansByName removeObjectForKey:span.name];
            }

            [blockSelf.spansById removeObjectForKey:spanId];
        }

        return YES;
    };

    [context addOnSpanStartCallback:spanStartCallback priority:BugsnagPerformancePriorityHigh];
    [context addOnSpanEndCallback:spanEndCallback priority:BugsnagPerformancePriorityLow];
}

- (void)start {
}

@end
