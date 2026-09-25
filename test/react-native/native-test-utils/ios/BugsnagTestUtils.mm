#import "BugsnagTestUtils.h"

#ifdef NATIVE_INTEGRATION
#import <BugsnagPerformance/BugsnagPerformance.h>
#import <BugsnagPerformance/BugsnagPerformanceConfiguration+Private.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanContext.h>
#import "BugsnagNativeSpansPlugin.h"
#import "BugsnagJavascriptSpansPlugin.h"
#import "BugsnagReactNativeAppStartPlugin.h"
#endif

@implementation BugsnagTestUtils

+ (void)startNativePerformanceIfConfigured {
    NSDictionary *config = [self readStartupConfig];
    if (!config) {
        NSLog(@"[BugsnagTestUtils] No startup configuration found, skipping native performance start");
        return;
    }
    
    NSDictionary *nativeConfig = config[@"native"];
    if (![nativeConfig isKindOfClass:[NSDictionary class]]) {
        NSLog(@"[BugsnagTestUtils] No native configuration found, skipping native performance start");
        return;
    }
    
    [self startNativePerformanceWithConfiguration:nativeConfig];
}

+ (nullable NSDictionary *)readStartupConfig {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    
    BOOL configured = [defaults boolForKey:@"configured"];
    if (!configured) {
        NSLog(@"[BugsnagTestUtils] No startup configuration found");
        return nil;
    }
    
    id configObj = [defaults objectForKey:@"startupConfig"];
    if (!configObj) {
        NSLog(@"[BugsnagTestUtils] Configuration flag set but no configuration found in NSUserDefaults");
        return nil;
    }
    
    // Handle both NSDictionary and JSON NSString representations
    if ([configObj isKindOfClass:[NSDictionary class]]) {
        NSLog(@"[BugsnagTestUtils] Read startup configuration dictionary: %@", configObj);
        return (NSDictionary *)configObj;
    } else if ([configObj isKindOfClass:[NSString class]]) {
        NSData *data = [(NSString *)configObj dataUsingEncoding:NSUTF8StringEncoding];
        if (data) {
            NSError *error = nil;
            id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
            if ([parsed isKindOfClass:[NSDictionary class]]) {
                NSLog(@"[BugsnagTestUtils] Read startup configuration from JSON string: %@", parsed);
                return (NSDictionary *)parsed;
            } else if (error) {
                NSLog(@"[BugsnagTestUtils] Error parsing startup configuration JSON: %@", error);
            }
        }
    }
    
    return nil;
}

+ (void)saveStartupConfig:(NSDictionary *)configuration {
    if (!configuration) {
        return;
    }
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

    [defaults setBool:YES forKey:@"configured"];
    [defaults setObject:configuration forKey:@"startupConfig"];
    [defaults synchronize];
    NSLog(@"[BugsnagTestUtils] Saved startup configuration: %@", configuration);
}

+ (void)clearStartupConfig {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setBool:NO forKey:@"configured"];
    [defaults removeObjectForKey:@"startupConfig"];
    [defaults synchronize];
    NSLog(@"[BugsnagTestUtils] Cleared startup configuration");
}

+ (BOOL)startNativePerformanceWithConfiguration:(NSDictionary *)configuration {
    #ifdef NATIVE_INTEGRATION
        @try {
            if (!configuration || ![configuration isKindOfClass:[NSDictionary class]]) {
                NSLog(@"[BugsnagTestUtils] Invalid or null configuration passed to startNativePerformance");
                return NO;
            }

            NSLog(@"[BugsnagTestUtils] Starting native performance with configuration: %@", configuration);
            
            BugsnagPerformanceConfiguration *config = [BugsnagPerformanceConfiguration loadConfig];

            NSString *apiKey = configuration[@"apiKey"];
            if ([apiKey isKindOfClass:[NSString class]] && apiKey.length > 0) {
                config.apiKey = apiKey;
            }

            NSString *endpoint = configuration[@"endpoint"];
            if ([endpoint isKindOfClass:[NSString class]] && endpoint.length > 0) {
                config.endpoint = [NSURL URLWithString:endpoint];
            }

            if (configuration[@"autoInstrumentAppStarts"] != nil && configuration[@"autoInstrumentAppStarts"] != [NSNull null]) {
                config.autoInstrumentAppStarts = [configuration[@"autoInstrumentAppStarts"] boolValue];
            } else {
                config.autoInstrumentAppStarts = YES;
            }

            if (configuration[@"autoInstrumentViewLoads"] != nil && configuration[@"autoInstrumentViewLoads"] != [NSNull null]) {
                config.autoInstrumentViewControllers = [configuration[@"autoInstrumentViewLoads"] boolValue];
            } else {
                config.autoInstrumentViewControllers = NO;
            }

            config.autoInstrumentNetworkRequests = NO;
            config.internal.autoTriggerExportOnBatchSize = 1;
            config.internal.clearPersistenceOnStart = YES;

            if (configuration[@"samplingProbability"] != nil && configuration[@"samplingProbability"] != [NSNull null]) {
                config.samplingProbability = [configuration[@"samplingProbability"] doubleValue];
            }

            if ([configuration[@"enabledMetrics"] isKindOfClass:[NSDictionary class]]) {
                NSDictionary *metricsConfig = configuration[@"enabledMetrics"];
                config.enabledMetrics.rendering = [metricsConfig[@"rendering"] boolValue];
                config.enabledMetrics.cpu = [metricsConfig[@"cpu"] boolValue];
                config.enabledMetrics.memory = [metricsConfig[@"memory"] boolValue];
            } else {
                config.enabledMetrics.cpu = YES;
                config.enabledMetrics.memory = YES;
                config.enabledMetrics.rendering = YES;
            }

            if (!configuration[@"nativeSpans"] || [configuration[@"nativeSpans"] boolValue]) {
                [config addPlugin:[[BugsnagNativeSpansPlugin alloc] init]];
            }
            if (!configuration[@"jsSpans"] || [configuration[@"jsSpans"] boolValue]) {
                [config addPlugin:[[BugsnagJavascriptSpansPlugin alloc] init]];
            }
            if (!configuration[@"nativeAppStarts"] || [configuration[@"nativeAppStarts"] boolValue]) {
                [config addPlugin:[[BugsnagReactNativeAppStartPlugin alloc] init]];
            }

            [BugsnagPerformance startWithConfiguration:config];
            
            NSLog(@"[BugsnagTestUtils] Native performance started successfully");
            
            return YES;
        } @catch (NSException *exception) {
            NSLog(@"[BugsnagTestUtils] Failed to start native performance: %@", exception);
            return NO;
        }
    #else
        NSLog(@"[BugsnagTestUtils] Native integration not enabled (NATIVE_INTEGRATION not defined), cannot start native performance");
        return NO;
    #endif
}

@end