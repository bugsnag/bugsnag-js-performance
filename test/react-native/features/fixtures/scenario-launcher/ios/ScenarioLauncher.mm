#import <Foundation/Foundation.h>
#import "Bugsnag.h"
#import "ScenarioLauncher.h"

@implementation ScenarioLauncher

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(startBugsnag:(NSDictionary *)configuration) {
  BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:configuration[@"apiKey"]];
  NSString *notifyEndpoint = configuration[@"notifyEndpoint"];
  NSString *sessionsEndpoint = configuration[@"sessionsEndpoint"];

  NSLog(@"Notify endpoint set to: %@\n", notifyEndpoint);
  NSLog(@"Sessions endpoint set to: %@\n", sessionsEndpoint);
  BugsnagEndpointConfiguration *endpoints = [[BugsnagEndpointConfiguration alloc] initWithNotify:notifyEndpoint sessions:sessionsEndpoint];

  [config setEndpoints:endpoints];
  [Bugsnag startWithConfiguration:config];
}

RCT_EXPORT_METHOD(clearPersistentData) {
  NSString *topLevelDir = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *dirPath = [topLevelDir stringByAppendingFormat:@"/bugsnag-shared-%@", [[NSBundle mainBundle] bundleIdentifier]];
  NSString *filePath = [dirPath stringByAppendingPathComponent:@"device-id.json"];
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSError *error;
  BOOL success = [fileManager removeItemAtPath:filePath error:&error];

  if (success) {
    NSLog(@"Deleted device-id.json");
  } else {
    NSLog(@"Could not delete device-id.json -:%@ ", [error localizedDescription]);
  }
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeScenarioLauncherSpecJSI>(params);
}
#endif

@end
