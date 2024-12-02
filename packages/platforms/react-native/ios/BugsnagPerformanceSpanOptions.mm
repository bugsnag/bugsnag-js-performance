#import "BugsnagPerformanceSpanOptions.h"

@implementation BugsnagPerformanceSpanOptions

- (instancetype)initWithName:(NSString *)name
                   startTime:(NSDate *)startTime
                  attributes:(NSDictionary<NSString *, id> *)attributes {
    self = [super init];
    return self;
}

- (NSString *)name {
    return @"";
}

- (NSDate *)startTime {
    return [NSDate date];
}

- (NSDictionary<NSString *, id> *)attributes {
    return @{};
}

@end
