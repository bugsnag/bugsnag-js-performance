#import "BugsnagPerformanceAppStartRegistry.h"

@implementation BugsnagPerformanceAppStartRegistry

static id<BugsnagPerformanceAppStartProvider> _Nullable _registeredProvider = nil;

+ (void)registerProvider:(nullable id<BugsnagPerformanceAppStartProvider>)provider {
    _registeredProvider = provider;
}

+ (nullable id<BugsnagPerformanceAppStartProvider>)provider {
    return _registeredProvider;
}

@end
