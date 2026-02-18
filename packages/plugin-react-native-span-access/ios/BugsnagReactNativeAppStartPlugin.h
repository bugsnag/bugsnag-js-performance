#import <Foundation/Foundation.h>
#import <BugsnagPerformance/BugsnagPerformancePlugin.h>
#import <BugsnagReactNativePerformance/BugsnagPerformanceAppStartProvider.h>

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagReactNativeAppStartPlugin: NSObject <BugsnagPerformancePlugin, BugsnagPerformanceAppStartProvider>

- (instancetype)init;
- (instancetype)initWithTimeout:(NSTimeInterval)timeout;

@end

NS_ASSUME_NONNULL_END