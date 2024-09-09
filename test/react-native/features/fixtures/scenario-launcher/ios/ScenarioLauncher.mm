#import <Foundation/Foundation.h>
#import "Bugsnag.h"
#import "ScenarioLauncher.h"

@implementation ScenarioLauncher

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(startBugsnag:(NSDictionary *)configuration resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  NSLog(@"Starting Bugsnag with configuration: %@\n", configuration);

  BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:configuration[@"apiKey"]];
  NSString *notifyEndpoint = configuration[@"notifyEndpoint"];
  NSString *sessionsEndpoint = configuration[@"sessionsEndpoint"];

  NSLog(@"Notify endpoint set to: %@\n", notifyEndpoint);
  NSLog(@"Sessions endpoint set to: %@\n", sessionsEndpoint);
  BugsnagEndpointConfiguration *endpoints = [[BugsnagEndpointConfiguration alloc] initWithNotify:notifyEndpoint sessions:sessionsEndpoint];

  [config setEndpoints:endpoints];
  [Bugsnag startWithConfiguration:config];

  resolve(nil);
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

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(saveStartupConfig:(NSDictionary *)config) {
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

  [defaults setBool:YES forKey:@"configured"];

  if (config[@"apiKey"]) {
    [defaults setObject:config[@"apiKey"] forKey:@"apiKey"];
  }

  if (config[@"endpoint"]) {
    [defaults setObject:config[@"endpoint"] forKey:@"endpoint"];
  }

  if (config[@"autoInstrumentAppStarts"]) {
    [defaults setBool:[config[@"autoInstrumentAppStarts"] boolValue] forKey:@"autoInstrumentAppStarts"];
  }

  if (config[@"autoInstrumentNetworkRequests"]) {
    [defaults setBool:[config[@"autoInstrumentNetworkRequests"] boolValue] forKey:@"autoInstrumentNetworkRequests"];
  }

  if (config[@"maximumBatchSize"]) {
    [defaults setInteger:[config[@"maximumBatchSize"] integerValue] forKey:@"maximumBatchSize"];
  }

  [defaults synchronize];

  dispatch_async(dispatch_get_main_queue(), ^{
        exit(0);
  });

  return nil;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(readStartupConfig) {
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

  BOOL configured = [defaults boolForKey:@"configured"];
  if (!configured) {
    return nil;
  }

  // NSString *apiKey = [defaults objectForKey:@"apiKey"] ? [defaults stringForKey:@"apiKey"] : @"";
  // NSString *endpoint = [defaults stringForKey:@"endpoint"];
  // BOOL autoInstrumentAppStarts = [defaults boolForKey:@"autoInstrumentAppStarts"];
  // BOOL autoInstrumentNetworkRequests = [defaults boolForKey:@"autoInstrumentNetworkRequests"];
  
  NSMutableDictionary *config = [NSMutableDictionary new];
  config[@"apiKey"] = [defaults objectForKey:@"apiKey"] ? [defaults stringForKey:@"apiKey"] : @"";
  config[@"endpoint"] = [defaults objectForKey:@"apiKey"] ? [defaults stringForKey:@"endpoint"] : @"";
  config[@"autoInstrumentAppStarts"] = [defaults objectForKey:@"autoInstrumentAppStarts"] ? [NSNumber numberWithBool:[defaults boolForKey:@"autoInstrumentAppStarts"]] : [NSNumber numberWithBool:YES];
  config[@"autoInstrumentNetworkRequests"] = [defaults objectForKey:@"autoInstrumentNetworkRequests"] ? [NSNumber numberWithBool:[defaults boolForKey:@"autoInstrumentNetworkRequests"]] : [NSNumber numberWithBool:YES];
  config[@"maximumBatchSize"] = [defaults objectForKey:@"maximumBatchSize"] ? [NSNumber numberWithInteger:[defaults integerForKey:@"maximumBatchSize"]] : [NSNumber numberWithInteger: 100];

  // make sure we don't leave this config around for the next startup
  [defaults setBool:NO forKey:@"configured"];
  [defaults removeObjectForKey:@"apiKey"];
  [defaults removeObjectForKey:@"endpoint"];
  [defaults removeObjectForKey:@"autoInstrumentAppStarts"];
  [defaults removeObjectForKey:@"autoInstrumentNetworkRequests"];
  [defaults removeObjectForKey:@"maximumBatchSize"];

  return config;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeScenarioLauncherSpecJSI>(params);
}
#endif

@end
