#import "BugsnagPerformanceSpanContext.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagPerformanceSpan : BugsnagPerformanceSpanContext

@property(nonatomic,readonly) BOOL isValid;

@property (nonatomic,readonly) NSString *name;
@property (nonatomic,readonly) NSDate *_Nullable startTime;
@property (nonatomic,readonly) NSDate *_Nullable endTime;

@property (nonatomic,readwrite) SpanId parentId;
@property (nonatomic,readonly) NSMutableDictionary *attributes;

- (void)abortIfOpen;

- (void)abortUnconditionally;

- (void)end;

- (void)endWithEndTime:(NSDate *)endTime NS_SWIFT_NAME(end(endTime:));

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value;

@end

NS_ASSUME_NONNULL_END