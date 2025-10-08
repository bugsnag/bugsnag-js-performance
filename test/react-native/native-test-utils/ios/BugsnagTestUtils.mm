#import "BugsnagTestUtils.h"

#ifdef NATIVE_INTEGRATION
#import <BugsnagPerformance/BugsnagPerformance.h>
#import <BugsnagPerformance/BugsnagPerformanceConfiguration+Private.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanContext.h>
#import "BugsnagNativeSpansPlugin.h"
#import "BugsnagJavascriptSpansPlugin.h"
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
    
    NSDictionary *config = [defaults dictionaryForKey:@"startupConfig"];
    if (!config) {
        NSLog(@"[BugsnagTestUtils] Configuration flag set but no configuration dictionary found");
        return nil;
    }
    
    NSLog(@"[BugsnagTestUtils] Read startup configuration: %@", config);

    return config;
}

+ (void)saveStartupConfig:(NSDictionary *)configuration {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

    [defaults setBool:YES forKey:@"configured"];
    [defaults setObject:configuration forKey:@"startupConfig"];
    [defaults synchronize];
}

+ (void)clearStartupConfig {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setBool:NO forKey:@"configured"];
    [defaults removeObjectForKey:@"startupConfig"];
    [defaults synchronize];
}

+ (BOOL)startNativePerformanceWithConfiguration:(NSDictionary *)configuration {
    #ifdef NATIVE_INTEGRATION
        @try {
            NSLog(@"[BugsnagTestUtils] Starting native performance with configuration: %@", configuration);
            
            BugsnagPerformanceConfiguration *config = [BugsnagPerformanceConfiguration loadConfig];

            NSString *apiKey = configuration[@"apiKey"];
            NSString *endpoint = configuration[@"endpoint"];

            // get autoInstrumentAppStarts boolean value from configuration dictionary
            BOOL autoInstrumentAppStarts = [configuration[@"autoInstrumentAppStarts"] boolValue];
            BOOL autoInstrumentViewLoads = [configuration[@"autoInstrumentViewLoads"] boolValue];

            config.apiKey = apiKey;
            config.endpoint = [[NSURL alloc] initWithString:endpoint];
            config.autoInstrumentAppStarts = autoInstrumentAppStarts;
            config.autoInstrumentViewControllers = autoInstrumentViewLoads;
            config.autoInstrumentNetworkRequests = NO;
            config.autoInstrumentRendering = YES;
            config.internal.autoTriggerExportOnBatchSize = 1;
            config.internal.clearPersistenceOnStart = YES;

            [config addPlugin:[BugsnagNativeSpansPlugin new]];
            [config addPlugin:[BugsnagJavascriptSpansPlugin new]];
            // [config addPlugin:[ReactNativeAppStartPlugin new]];

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

