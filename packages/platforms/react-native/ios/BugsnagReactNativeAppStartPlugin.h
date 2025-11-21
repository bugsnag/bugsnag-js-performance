#import <Foundation/Foundation.h>
#import "BugsnagPerformancePlugin.h"

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagReactNativeAppStartPlugin: NSObject <BugsnagPerformancePlugin>

- (instancetype)init;
- (instancetype)initWithTimeout:(NSTimeInterval)timeout;

@end

NS_ASSUME_NONNULL_END