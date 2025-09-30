#import "BugsnagTestUtils.h"

#ifdef NATIVE_INTEGRATION
#import <BugsnagPerformance/BugsnagPerformance.h>
#import <BugsnagPerformance/BugsnagPerformanceConfiguration+Private.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanContext.h>
#import "BugsnagNativeSpansPlugin.h"
#import "BugsnagJavascriptSpansPlugin.h"
#endif

@implementation BugsnagTestUtils

+ (nullable NSDictionary *)readStartupConfig {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    
    BOOL configured = [defaults boolForKey:@"configured"];
    if (!configured) {
        NSLog(@"[BugsnagTestUtils] No startup configuration found");
        return nil;
    }
    
    NSMutableDictionary *config = [NSMutableDictionary new];
    config[@"apiKey"] = [defaults objectForKey:@"apiKey"] ? [defaults stringForKey:@"apiKey"] : @"";
    config[@"endpoint"] = [defaults objectForKey:@"endpoint"] ? [defaults stringForKey:@"endpoint"] : @"";
    config[@"autoInstrumentAppStarts"] = @([defaults boolForKey:@"autoInstrumentAppStarts"]);
    config[@"autoInstrumentNetworkRequests"] = @([defaults boolForKey:@"autoInstrumentNetworkRequests"]);
    config[@"maximumBatchSize"] = @([defaults integerForKey:@"maximumBatchSize"]);
    config[@"useWrapperComponentProvider"] = @([defaults boolForKey:@"useWrapperComponentProvider"]);
    config[@"scenario"] = [defaults objectForKey:@"scenario"] ? [defaults stringForKey:@"scenario"] : @"";
    config[@"attach"] = @([defaults boolForKey:@"attach"]);
    
    NSLog(@"[BugsnagTestUtils] Read startup configuration: %@", config);

    return [config copy];
}

+ (void)saveStartupConfig:(NSDictionary *)configuration {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

    [defaults setBool:YES forKey:@"configured"];

    if (configuration[@"apiKey"]) {
      [defaults setObject:configuration[@"apiKey"] forKey:@"apiKey"];
    }

    if (configuration[@"endpoint"]) {
      [defaults setObject:configuration[@"endpoint"] forKey:@"endpoint"];
    }

    if (configuration[@"autoInstrumentAppStarts"]) {
      [defaults setBool:[configuration[@"autoInstrumentAppStarts"] boolValue] forKey:@"autoInstrumentAppStarts"];
    }

    if (configuration[@"autoInstrumentNetworkRequests"]) {
      [defaults setBool:[configuration[@"autoInstrumentNetworkRequests"] boolValue] forKey:@"autoInstrumentNetworkRequests"];
    }

    if (configuration[@"maximumBatchSize"]) {
      [defaults setInteger:[configuration[@"maximumBatchSize"] integerValue] forKey:@"maximumBatchSize"];
    }

    if (configuration[@"useWrapperComponentProvider"]) {
      [defaults setBool:[configuration[@"useWrapperComponentProvider"] boolValue] forKey:@"useWrapperComponentProvider"];
    }

    if (configuration[@"scenario"]) {
      [defaults setObject:configuration[@"scenario"] forKey:@"scenario"];
    }

    [defaults synchronize];
}

+ (void)clearStartupConfig {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setBool:NO forKey:@"configured"];
    [defaults removeObjectForKey:@"apiKey"];
    [defaults removeObjectForKey:@"endpoint"];
    [defaults removeObjectForKey:@"autoInstrumentAppStarts"];
    [defaults removeObjectForKey:@"autoInstrumentNetworkRequests"];
    [defaults removeObjectForKey:@"maximumBatchSize"];
    [defaults removeObjectForKey:@"useWrapperComponentProvider"];
    [defaults removeObjectForKey:@"scenario"];
    [defaults synchronize];
}

+ (BOOL)startNativePerformanceWithConfiguration:(NSDictionary *)configuration {
    #ifdef NATIVE_INTEGRATION
        @try {
            NSLog(@"[BugsnagTestUtils] Starting native performance with configuration: %@", configuration);
            
            BugsnagPerformanceConfiguration *config = [BugsnagPerformanceConfiguration loadConfig];

            NSString *apiKey = configuration[@"apiKey"];
            NSString *endpoint = configuration[@"endpoint"];

            config.apiKey = apiKey;
            config.endpoint = [[NSURL alloc] initWithString:endpoint];
            config.autoInstrumentAppStarts = NO;
            config.autoInstrumentViewControllers = NO;
            config.autoInstrumentNetworkRequests = NO;
            config.autoInstrumentRendering = YES;
            config.internal.autoTriggerExportOnBatchSize = 1;
            config.internal.clearPersistenceOnStart = YES;

            [config addPlugin:[BugsnagNativeSpansPlugin new]];
            [config addPlugin:[BugsnagJavascriptSpansPlugin new]];

            [BugsnagPerformance startWithConfiguration:config];
            
            NSLog(@"[BugsnagTestUtils] Native performance started successfully");
            
            return YES;
        } @catch (NSException *exception) {
            NSLog(@"[BugsnagTestUtils] Failed to start native performance: %@", exception);
            return NO;
        }
    #else
        NSLog(@"[BugsnagTestUtils] Native integration not enabled, cannot start native performance");
        return NO;
    #endif
}

@end

