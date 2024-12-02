#import "BugsnagPerformanceSpan.h"

@implementation BugsnagPerformanceSpan

- (BOOL)isValid {
    return NO;
}

- (NSString *)name {
    return @"";
}

- (NSDate *_Nullable)startTime {
    return nil;
}

- (NSDate *_Nullable)endTime {
    return nil;
}

- (SpanId)parentId {
    return 0;
}

- (void)setParentId:(SpanId)parentId {
    // No-op
}

- (NSMutableDictionary *)attributes {
    return [NSMutableDictionary dictionary];
}

- (void)abortIfOpen {
    // No-op
}

- (void)abortUnconditionally {
    // No-op
}

- (void)end {
    // No-op
}

- (void)endWithEndTime:(NSDate *)endTime {
    // No-op
}

- (void)setAttribute:(NSString *)attributeName withValue:(id _Nullable)value {
    // No-op
}

@end
