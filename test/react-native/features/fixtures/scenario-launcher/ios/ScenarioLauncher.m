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

  notifyEndpoint = [NSString stringWithFormat:@"http://%@/notify", mazeRunnerAddress];
  sessionsEndpoint = [NSString stringWithFormat:@"http://%@/sessions", mazeRunnerAddress];

  NSLog(@"Notify endpoint set to: %@\n", notifyEndpoint);
  NSLog(@"Sessions endpoint set to: %@\n", sessionsEndpoint);
  BugsnagEndpointConfiguration *endpoints = [[BugsnagEndpointConfiguration alloc] initWithNotify:notifyEndpoint sessions:sessionsEndpoint];

  [config setEndpoints:endpoints];
  [Bugsnag startWithConfiguration:config];
}

RCT_EXPORT_MODULE();

@end
