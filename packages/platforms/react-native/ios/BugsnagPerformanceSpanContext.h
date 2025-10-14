// Copied from BugsnagPerformanceSpanContext.h in bugsnag-cocoa-performance
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef uint64_t SpanId;

OBJC_EXPORT
@interface BugsnagPerformanceSpanContext : NSObject

@property(nonatomic,readonly) SpanId spanId;
@property(nonatomic,readonly) uint64_t traceIdHi;
@property(nonatomic,readonly) uint64_t traceIdLo;

- (instancetype) initWithTraceIdHi:(uint64_t)traceIdHi traceIdLo:(uint64_t)traceIdLo spanId:(SpanId)spanId;

- (NSString *)encodedAsTraceParent;

@end

NS_ASSUME_NONNULL_END
