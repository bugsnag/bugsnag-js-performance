#import <Foundation/Foundation.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanControl.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanContext.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^OnSpanUpdatedCallback)(BOOL result);

typedef void (^RemoteSpanContextCallback)(BugsnagPerformanceSpanContext * _Nullable context);

@interface BugsnagJavascriptSpanTransaction : NSObject

- (void)end;

- (void)endWithEndTime:(NSDate *)endTime NS_SWIFT_NAME(end(endTime:));

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value;

- (void)commit:(OnSpanUpdatedCallback)callback;

@end

@interface BugsnagJavascriptSpanControl : NSObject<BugsnagPerformanceSpanControl>

- (BugsnagJavascriptSpanTransaction *)createUpdateTransaction;

- (void)getSpanContext:(RemoteSpanContextCallback)callback;

@end

NS_ASSUME_NONNULL_END
