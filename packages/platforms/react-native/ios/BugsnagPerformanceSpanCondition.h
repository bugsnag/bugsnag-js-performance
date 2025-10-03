// Copied from BugsnagPerformanceSpanCondition.h in bugsnag-cocoa-performance
#import <Foundation/Foundation.h>
#import "BugsnagPerformanceSpanContext.h"

OBJC_EXPORT
@interface BugsnagPerformanceSpanCondition: NSObject

@property (nonatomic) BOOL isActive;

- (void)closeWithEndTime:(NSDate *)endTime NS_SWIFT_NAME(close(endTime:));
- (BugsnagPerformanceSpanContext *)upgrade;
- (void)cancel;

@end

