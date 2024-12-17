// Copied from BugsnagPerformanceSpan.h in bugsnag-cocoa-performance
#import "BugsnagPerformanceSpanContext.h"

NS_ASSUME_NONNULL_BEGIN

OBJC_EXPORT
@interface BugsnagPerformanceSpan : BugsnagPerformanceSpanContext

@property(nonatomic,readonly) BOOL isValid;

@property (nonatomic,readonly) NSString *name;
@property (nonatomic,readonly) NSDate *_Nullable startTime;
@property (nonatomic,readonly) NSDate *_Nullable endTime;

- (instancetype)init NS_UNAVAILABLE;

- (instancetype) initWithTraceIdHi:(uint64_t)traceIdHi traceIdLo:(uint64_t)traceIdLo spanId:(SpanId)spanId NS_UNAVAILABLE;

- (void)abortIfOpen;

- (void)abortUnconditionally;

- (void)end;

- (void)endWithEndTime:(NSDate *)endTime NS_SWIFT_NAME(end(endTime:));

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value;

#pragma mark Private APIs (BugsnagPerformanceSpan+Private.h)

@property (nonatomic,readonly) NSMutableDictionary *attributes;
@property (nonatomic,readwrite) SpanId parentId;
@property (nonatomic) double samplingProbability;

- (void)markEndTime:(NSDate *)endTime;

- (void)sendForProcessing;

@end

NS_ASSUME_NONNULL_END
