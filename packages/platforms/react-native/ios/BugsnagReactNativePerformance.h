#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <BugsnagReactNativePerformanceSpec/BugsnagReactNativePerformanceSpec.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagReactNativePerformance: NSObject <RCTBridgeModule>

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface BugsnagReactNativePerformance () <NativeBugsnagPerformanceSpec>

@end
#endif

NS_ASSUME_NONNULL_END