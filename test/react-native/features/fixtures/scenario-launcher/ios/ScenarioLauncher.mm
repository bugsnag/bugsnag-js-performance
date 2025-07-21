#import <Foundation/Foundation.h>
#import "Bugsnag.h"
#import "ScenarioLauncher.h"

#ifdef NATIVE_INTEGRATION
#import <BugsnagPerformance/BugsnagPerformance.h>
#import <BugsnagPerformance/BugsnagPerformanceConfiguration+Private.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanContext.h>
#import "BugsnagNativeSpansPlugin.h"
#import "BugsnagJavascriptSpansPlugin.h"
#import "BugsnagJavascriptSpanQuery.h"
#import "BugsnagjavascriptSpanControl.h"
#endif

@implementation ScenarioLauncher {
  NSMutableDictionary *openSpans;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
    if (self = [super init]) {
        openSpans = [NSMutableDictionary new];
    }
    return self;
}

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

    if (config[@"useWrapperComponentProvider"]) {
    [defaults setBool:[config[@"useWrapperComponentProvider"] boolValue] forKey:@"useWrapperComponentProvider"];
  }

  [defaults synchronize];

  return nil;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(readStartupConfig) {
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

  BOOL configured = [defaults boolForKey:@"configured"];
  if (!configured) {
    return nil;
  }

  NSMutableDictionary *config = [NSMutableDictionary new];
  config[@"apiKey"] = [defaults objectForKey:@"apiKey"] ? [defaults stringForKey:@"apiKey"] : @"";
  config[@"endpoint"] = [defaults objectForKey:@"apiKey"] ? [defaults stringForKey:@"endpoint"] : @"";
  config[@"autoInstrumentAppStarts"] = [NSNumber numberWithBool:[defaults boolForKey:@"autoInstrumentAppStarts"]];
  config[@"autoInstrumentNetworkRequests"] = [NSNumber numberWithBool:[defaults boolForKey:@"autoInstrumentNetworkRequests"]];
  config[@"maximumBatchSize"] = [NSNumber numberWithInteger:[defaults integerForKey:@"maximumBatchSize"]];
  config[@"useWrapperComponentProvider"] = [NSNumber numberWithBool:[defaults boolForKey:@"useWrapperComponentProvider"]];

  // make sure we don't leave this config around for the next startup
  [defaults setBool:NO forKey:@"configured"];
  [defaults removeObjectForKey:@"apiKey"];
  [defaults removeObjectForKey:@"endpoint"];
  [defaults removeObjectForKey:@"autoInstrumentAppStarts"];
  [defaults removeObjectForKey:@"autoInstrumentNetworkRequests"];
  [defaults removeObjectForKey:@"maximumBatchSize"];
  [defaults removeObjectForKey:@"useWrapperComponentProvider"];

  [defaults synchronize];

  return config;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(exitApp) {
  dispatch_async(dispatch_get_main_queue(), ^{
        exit(0);
  });

  return nil;
}

#ifdef NATIVE_INTEGRATION
RCT_EXPORT_METHOD(startNativePerformance:(NSDictionary *)configuration resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  NSLog(@"Starting Cocoa Performance with configuration: %@\n", configuration);

  NSString *apiKey = configuration[@"apiKey"];
  NSString *endpoint = configuration[@"endpoint"];

  dispatch_async(dispatch_get_main_queue(), ^{
    BugsnagPerformanceConfiguration *config = [BugsnagPerformanceConfiguration loadConfig];
    config.apiKey = apiKey;
    config.endpoint = [[NSURL alloc] initWithString: endpoint];
    config.autoInstrumentAppStarts = NO;
    config.autoInstrumentViewControllers = NO;
    config.autoInstrumentNetworkRequests = NO;
    config.autoInstrumentRendering = YES;
    config.internal.autoTriggerExportOnBatchSize = 1;
    config.internal.clearPersistenceOnStart = YES;

    [config addPlugin:[BugsnagNativeSpansPlugin new]];
    [config addPlugin:[BugsnagJavascriptSpansPlugin new]];

    [BugsnagPerformance startWithConfiguration:config];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(startNativeSpan:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  BugsnagPerformanceSpanOptions *spanOptions = [BugsnagPerformanceSpanOptions new];
  if (options[@"traceParent"]) {
    BugsnagPerformanceRemoteSpanContext *parentContext = [BugsnagPerformanceRemoteSpanContext contextWithTraceParentString:options[@"traceParent"]];
    spanOptions.parentContext = parentContext;
  }

  BugsnagPerformanceSpan *span = [BugsnagPerformance startSpanWithName:options[@"name"] options:spanOptions];
  NSString *traceParent = [span encodedAsTraceParent];
  [openSpans setObject:span forKey:traceParent];
  resolve(traceParent);
}

RCT_EXPORT_METHOD(endNativeSpan:(NSString *)traceParent resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  BugsnagPerformanceSpan *span = [openSpans objectForKey:traceParent];
  if (span) {
    [span end];
    [openSpans removeObjectForKey:traceParent];
    resolve([NSNumber numberWithBool:YES]);
  } else {
    resolve([NSNumber numberWithBool:NO]);
  }
}

RCT_EXPORT_METHOD(updateJavascriptSpan:(NSString *)spanName attributes:(NSArray<NSDictionary *> *)attributes resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  BugsnagJavascriptSpanQuery *spanQuery = [BugsnagJavascriptSpanQuery queryWithName:spanName];
  BugsnagJavascriptSpanControl *spanControl = [BugsnagPerformance getSpanControlsWithQuery:spanQuery];
  BugsnagJavascriptSpanTransaction *transaction = [spanControl createUpdateTransaction];
  NSDate *endTime = [NSDate date];
  
  // Set some attributes
  for (NSDictionary *attribute in attributes) {
    NSString *name = attribute[@"name"];
    id value = attribute[@"value"];
    if (name) {
      [transaction setAttribute:name withValue:value];
    }
  }

  // End the span with a specific end time and commit the transaction
  [transaction endWithEndTime:endTime];
  [transaction commit:^(BOOL result) {
    NSLog(@"Span update result: %@", result ? @"YES" : @"NO");
  }];

  resolve(nil);
}

RCT_EXPORT_METHOD(sendNativeSpanWithJsParent:(NSString *)spanName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  BugsnagJavascriptSpanQuery *spanQuery = [BugsnagJavascriptSpanQuery queryWithName:spanName];
  BugsnagJavascriptSpanControl *spanControl = [BugsnagPerformance getSpanControlsWithQuery:spanQuery];

  [spanControl retrieveSpanContext:^(BugsnagPerformanceSpanContext * _Nullable context) {
    if (context) {
      BugsnagPerformanceSpanOptions *options = [BugsnagPerformanceSpanOptions new];
      options.parentContext = context;
      BugsnagPerformanceSpan *childSpan = [BugsnagPerformance startSpanWithName:@"Native Child Span" options:options];
      [childSpan end];
      resolve(nil);
    } else {
      reject(@"send_native_span_with_js_parent", @"Failed to get JS span context", nil);
    }
  }];
}

#else
RCT_EXPORT_METHOD(startNativePerformance:(NSDictionary *)configuration resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  NSLog(@"Native performance is not enabled in this build");
  reject(@"start_native_performance", @"Native performance is not enabled in this build", nil);
}

RCT_EXPORT_METHOD(startNativeSpan:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  NSLog(@"Native performance is not enabled in this build");
  reject(@"start_native_span", @"Native performance is not enabled in this build", nil);
}

RCT_EXPORT_METHOD(endNativeSpan:(NSString *)traceParent resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  NSLog(@"Native performance is not enabled in this build");
  reject(@"end_native_span", @"Native performance is not enabled in this build", nil);
}

RCT_EXPORT_METHOD(updateJavascriptSpan:(NSString *)spanName attributes:(NSArray<NSDictionary *> *)attributes resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  NSLog(@"Native performance is not enabled in this build");
  reject(@"update_javascript_span", @"Native performance is not enabled in this build", nil);
}

RCT_EXPORT_METHOD(sendNativeSpanWithJsParent:(NSString *)spanName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  NSLog(@"Native performance is not enabled in this build");
  reject(@"send_native_span_with_js_parent", @"Native performance is not enabled in this build", nil);
}

#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeScenarioLauncherSpecJSI>(params);
}
#endif

@end
