#import "BugsnagNativeSpansPlugin+Private.h"
#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import <BugsnagPerformance/BugsnagPerformancePluginContext.h>
#import <map>

static const NSTimeInterval kSpanTimeoutInterval = 600; // 10 minutes

// Forward declaration for utility function
static NSString *createNativeSpanId(BugsnagPerformanceSpan *span);

@implementation BugsnagNativeSpansPlugin {
    // Private instance variable for span timeout timers
    std::map<void *, dispatch_source_t> _spanTimeoutTimers;
}

static BugsnagNativeSpansPlugin *_sharedInstance = nil;

+ (id)singleton {
    return _sharedInstance;
}

// Create a timeout timer for a span
- (dispatch_source_t)createSpanTimeoutTimer:(BugsnagPerformanceSpan *)span {
    __weak BugsnagNativeSpansPlugin *weakSelf = self;

    dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0,
                                                     dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0));
    
    dispatch_source_set_timer(timer,
                             dispatch_time(DISPATCH_TIME_NOW, (int64_t)(kSpanTimeoutInterval * NSEC_PER_SEC)),
                             DISPATCH_TIME_FOREVER,
                             0);
    
    dispatch_source_set_event_handler(timer, ^{
        [weakSelf endNativeSpan:span];
    });
    
    dispatch_resume(timer);
    return timer;
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
            dispatch_source_cancel(it->second);
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
            BugsnagPerformanceSpan *existingSpan = blockSelf.spansByName[span.name];
            if (existingSpan) {
                // If a span with the same name already exists, remove it from the cache and clean up its timer
                [blockSelf endNativeSpan:existingSpan];
            }

            blockSelf.spansByName[span.name] = span;
            blockSelf.spansById[spanId] = span;

            // Add a 10 minute timeout to remove the span from caches if not ended
            void *key = (__bridge void *)span;
            dispatch_source_t timer = [blockSelf createSpanTimeoutTimer:span];
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
