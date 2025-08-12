#import "BugsnagNativeSpansPlugin+Private.h"
#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import <BugsnagPerformance/BugsnagPerformancePluginContext.h>
#import <map>

static const NSTimeInterval kSpanTimeoutInterval = 600; // 10 minutes

// Forward declaration for utility function
static NSString *createNativeSpanId(BugsnagPerformanceSpan *span);

@implementation BugsnagNativeSpansPlugin {
    // Private instance variable for span timeout timers
    std::map<void *, NSTimer *> _spanTimeoutTimers;
}

static BugsnagNativeSpansPlugin *_sharedInstance = nil;

+ (id)singleton {
    return _sharedInstance;
}

// Create a timeout timer for a span
- (NSTimer *)createSpanTimeoutTimer:(BugsnagPerformanceSpan *)span {
    __weak BugsnagNativeSpansPlugin *weakSelf = self;
    return [NSTimer scheduledTimerWithTimeInterval:kSpanTimeoutInterval repeats:NO block:^(NSTimer * _Nonnull timer) {
        [weakSelf endNativeSpan:span];
    }];
}

// remove the spans from the caches and clean up timer
- (BOOL)endNativeSpan:(BugsnagPerformanceSpan *)span {
    NSString *spanId = createNativeSpanId(span);
    void *key = (__bridge void *)span;

    @synchronized (self) {
        // Remove span from caches
        if ([self.spansByName objectForKey:span.name] == span) {
            [self.spansByName removeObjectForKey:span.name];
        }
        [self.spansById removeObjectForKey:spanId];

        // Clean up timer for this span using the instance member
        auto& timerMap = _spanTimeoutTimers;
        auto it = timerMap.find(key);
        if (it != timerMap.end()) {
            [it->second invalidate];
            timerMap.erase(it);
        }
    }
    return YES;
}

- (void)installWithContext:(BugsnagPerformancePluginContext *)context {
    _sharedInstance = self;
    _spansByName = [NSMutableDictionary new];
    _spansById = [NSMutableDictionary new];

    // add the spans to the caches when they are started
    __block BugsnagNativeSpansPlugin *blockSelf = self;
    BugsnagPerformanceSpanStartCallback spanStartCallback = ^(BugsnagPerformanceSpan *span) {
        NSString *spanId = createNativeSpanId(span);

        @synchronized (blockSelf) {
            blockSelf.spansByName[span.name] = span;
            blockSelf.spansById[spanId] = span;

            // Add a 10 minute timeout to remove the span from caches if not ended
            void *key = (__bridge void *)span;
            NSTimer *timer = [blockSelf createSpanTimeoutTimer:span];
            blockSelf->_spanTimeoutTimers[key] = timer;
        }
    };

    // remove the spans from the caches when they are ended
    BugsnagPerformanceSpanEndCallback spanEndCallback = ^(BugsnagPerformanceSpan *span) {
        return [blockSelf endNativeSpan:span];
    };

    [context addOnSpanStartCallback:spanStartCallback priority:BugsnagPerformancePriorityHigh];
    [context addOnSpanEndCallback:spanEndCallback priority:BugsnagPerformancePriorityLow];
}

- (void)start {
}

@end

// generate a unique ID for the span based on its traceId and spanId
static NSString *createNativeSpanId(BugsnagPerformanceSpan *span) {
    return [NSString stringWithFormat:@"%016llx:%016llx%016llx", span.spanId, span.traceIdHi, span.traceIdLo];
}
