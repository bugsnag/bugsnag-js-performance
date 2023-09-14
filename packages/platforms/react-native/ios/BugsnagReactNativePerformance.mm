#import "BugsnagReactNativePerformance.h"
#import <sys/sysctl.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "BugsnagReactNativePerformanceSpec.h"
#endif

@implementation BugsnagReactNativePerformance

RCT_EXPORT_MODULE()

static NSString *sysctlString(const char *name) noexcept {
    char value[32];
    auto size = sizeof value;
    if (sysctlbyname(name, value, &size, NULL, 0) == 0) {
        value[sizeof value - 1] = '\0';
        return [NSString stringWithCString:value encoding:NSUTF8StringEncoding];
    } else {
        return nil;
    }
}

static NSString *deviceModelIdentifier() noexcept {
#if TARGET_OS_OSX || TARGET_OS_SIMULATOR || (defined(TARGET_OS_MACCATALYST) && TARGET_OS_MACCATALYST)
    return sysctlString("hw.model");
#else
    return sysctlString("hw.machine");
#endif
}

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

    NSString *versionCode = infoDictionary[@"CFBundleVersion"];
    if (versionCode) {
        info[@"bundleVersion"] = versionCode;
    }

    NSString *modelIdentifier = deviceModelIdentifier();
    if (modelIdentifier) {
        info[@"model"] = modelIdentifier;
    }
     
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