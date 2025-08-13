#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <BugsnagNativeSpansSpec/BugsnagNativeSpansSpec.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface BugsnagNativeSpans : RCTEventEmitter <RCTBridgeModule>

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface BugsnagNativeSpans () <NativeBugsnagNativeSpansSpec>

@end
#endif

NS_ASSUME_NONNULL_END
