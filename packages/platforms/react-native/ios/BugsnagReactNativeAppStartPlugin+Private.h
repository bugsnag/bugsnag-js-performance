#import "BugsnagReactNativeAppStartPlugin.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagReactNativeAppStartPlugin ()

+ (id _Nullable)singleton;

- (NSString * _Nullable)getAppStartParent;

- (void)endAppStart:(NSDate *)endTime;

@end

NS_ASSUME_NONNULL_END