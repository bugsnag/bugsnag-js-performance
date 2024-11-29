#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef union {
    __uint128_t value;
    struct {
        uint64_t lo;
        uint64_t hi;
    };
} TraceId;

typedef uint64_t SpanId;

@interface BugsnagPerformanceSpanContext : NSObject

@property(nonatomic) TraceId traceId;
@property(nonatomic) SpanId spanId;

- (instancetype) initWithTraceIdHi:(uint64_t)traceIdHi traceIdLo:(uint64_t)traceIdLo spanId:(SpanId)spanId;

@end

NS_ASSUME_NONNULL_END
