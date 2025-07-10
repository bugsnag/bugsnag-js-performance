#import <Foundation/Foundation.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanControl.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagJavascriptSpanMutator : NSObject

- (void)end;

- (void)endWithEndTime:(NSDate *)endTime NS_SWIFT_NAME(end(endTime:));

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value;

@end

typedef void (^BugsnagJavascriptSpanUpdateBlock)(BugsnagJavascriptSpanMutator *mutator);

@interface BugsnagJavascriptSpanControl : NSObject<BugsnagPerformanceSpanControl>

- (void)updateSpanWithUpdate:(BugsnagJavascriptSpanUpdateBlock)updateBlock;

@end

NS_ASSUME_NONNULL_END
