#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <BugsnagRemoteSpansSpec/BugsnagRemoteSpansSpec.h>
#endif


NS_ASSUME_NONNULL_BEGIN

@interface BugsnagRemoteSpans: NSObject <RCTBridgeModule>

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface BugsnagRemoteSpans () <NativeBugsnagRemoteSpansSpec>

@end
#endif

NS_ASSUME_NONNULL_END
