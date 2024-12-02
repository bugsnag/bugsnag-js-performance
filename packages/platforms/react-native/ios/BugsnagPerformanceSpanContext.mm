#import "BugsnagPerformanceSpanContext.h"

@implementation BugsnagPerformanceSpanContext

- (instancetype) initWithTraceIdHi:(uint64_t)traceIdHi traceIdLo:(uint64_t)traceIdLo spanId:(SpanId)spanId {
    self = [super init];
    return self;
}

@end
