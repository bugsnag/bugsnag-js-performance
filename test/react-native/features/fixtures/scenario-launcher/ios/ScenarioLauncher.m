#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "Bugsnag.h"
#import "ScenarioLauncher.h"
#import "ConfigFileReader.h"

@implementation ScenarioLauncher

RCT_EXPORT_METHOD(startBugsnag) {
  NSLog(@"Called startBugsnag, fetching configuration from ConfigFileReader");
  NSString *mazeRunnerAddress = [[ConfigFileReader new] loadMazeRunnerAddress];

  BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:@"1234567890abcdef1234567890abcdef"];
  NSString *notifyEndpoint;
  NSString *sessionsEndpoint;

  notifyEndpoint = [NSString stringWithFormat:@"%@/notify", mazeRunnerAddress];
  sessionsEndpoint = [NSString stringWithFormat:@"%@/sessions", mazeRunnerAddress];

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

RCT_EXPORT_MODULE();

// Start Bugsnag when the module is initialized
- (instancetype)init
{
  self = [super init];

  [self startBugsnag];
  [self clearPersistentData];

  return self;
}

@end
