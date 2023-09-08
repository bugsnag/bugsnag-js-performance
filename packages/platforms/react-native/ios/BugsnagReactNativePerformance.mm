#import "BugsnagReactNativePerformance.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "BugsnagReactNativePerformanceSpec.h"
#endif

@implementation BugsnagReactNativePerformance

RCT_EXPORT_MODULE()

static NSString *hostArch() noexcept {
#if TARGET_CPU_ARM
    return @"arm32";
#elif TARGET_CPU_ARM64
    return @"arm64";
#elif TARGET_CPU_X86
    return @"x86";
#elif TARGET_CPU_X86_64
    return @"amd64";
#endif
}

- (NSDictionary *)getDeviceInfo {
    NSMutableDictionary *info = [NSMutableDictionary new];
    auto infoDictionary = NSBundle.mainBundle.infoDictionary;
    info[@"arch"] = hostArch();
    info[@"bundleVersion"] = infoDictionary[@"CFBundleVersion"] ?: @"";
    info[@"versionCode"] = @"";
    return info;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBugsnagPerformanceSpecJSI>(params);
}
#endif

@end