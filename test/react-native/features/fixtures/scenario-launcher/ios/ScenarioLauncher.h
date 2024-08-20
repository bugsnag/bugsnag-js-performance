#ifndef ScenarioLauncher_h
#define ScenarioLauncher_h

#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <ScenarioLauncherSpec/ScenarioLauncherSpec.h>
#endif

@interface ScenarioLauncher : NSObject<RCTBridgeModule>
    - (void) startBugsnag:(NSDictionary *)configuration;
    - (void) clearPersistentData;
@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface ScenarioLauncher () <NativeScenarioLauncherSpec>
@end
#endif

#endif /* ScenarioLauncher_h */
