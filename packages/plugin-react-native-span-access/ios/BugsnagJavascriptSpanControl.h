#import <Foundation/Foundation.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanControl.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagJavascriptSpanTransaction : NSObject

- (void)end;

- (void)endWithEndTime:(NSDate *)endTime NS_SWIFT_NAME(end(endTime:));

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value;

- (void)commit;

@end

@interface BugsnagJavascriptSpanControl : NSObject<BugsnagPerformanceSpanControl>

- (BugsnagJavascriptSpanTransaction *)createUpdateTransaction;

@end

NS_ASSUME_NONNULL_END
