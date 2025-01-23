#import "BugsnagReactNativePerformance.h"
#import "BugsnagReactNativePerformanceCrossTalkAPIClient.h"
#import "ReactNativeSpanAttributes.h"
#import <sys/sysctl.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "BugsnagReactNativePerformanceSpec.h"
#endif

@implementation BugsnagReactNativePerformance

static NSUInteger traceIdMidpoint = 16;

static NSTimeInterval hourInSeconds = 3600;

/**
* A dictionary of open native spans, keyed by the span ID and trace ID,
* so that they can be retrieved and closed/discarded from JS.
* 
* Since native spans are only ever started and ended from the JS thread,
* no thread synchronization is required when accessing.
*/
NSMutableDictionary *openSpans;

NSTimer *longRunningSpansTimer;

RCT_EXPORT_MODULE()

- (instancetype)init
{
    if (self = [super init]) {
        openSpans = [NSMutableDictionary new];
    }
    return self;
}

static NSString *sysctlString(const char *name) noexcept {
    char value[32];
    auto size = sizeof value;
    if (sysctlbyname(name, value, &size, NULL, 0) == 0) {
        value[sizeof value - 1] = '\0';
        return [NSString stringWithCString:value encoding:NSUTF8StringEncoding];
    } else {
        return nil;
    }
}

static NSString *deviceModelIdentifier() noexcept {
#if TARGET_OS_OSX || TARGET_OS_SIMULATOR || (defined(TARGET_OS_MACCATALYST) && TARGET_OS_MACCATALYST)
    return sysctlString("hw.model");
#else
    return sysctlString("hw.machine");
#endif
}

static NSString *hostArch() noexcept {
#if TARGET_CPU_ARM
    return @"arm32";
#elif TARGET_CPU_ARM64
    return @"arm64";
#elif TARGET_CPU_X86
    return @"x86";
#elif TARGET_CPU_X86_64
    return @"amd64";
#endif
}

static uint64_t hexStringToUInt64(NSString *hexString) {
    if (hexString == nil || [hexString length] == 0) {
        return 0;
    }

    uint64_t result = 0;
    NSScanner *scanner = [NSScanner scannerWithString:hexString];
    [scanner setScanLocation:0];

    if (![scanner scanHexLongLong:&result]) {
        return 0;
    }

    return result;
}

static NSString *getRandomBytes() noexcept {
    const int POOL_SIZE = 1024;
    UInt8 bytes[POOL_SIZE];
    NSMutableString *hexStr = [NSMutableString stringWithCapacity:POOL_SIZE * 2];
    int status = SecRandomCopyBytes(kSecRandomDefault, POOL_SIZE, &bytes);
    if (status == errSecSuccess) {
        for (int i = 0; i < POOL_SIZE; i++) {
            [hexStr appendFormat:@"%02x", bytes[i]];
        }
    }
    
    return hexStr;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getDeviceInfo) {
    NSMutableDictionary *info = [NSMutableDictionary new];
    auto infoDictionary = NSBundle.mainBundle.infoDictionary;
    info[@"arch"] = hostArch();

    NSString *bundleIdentifier = infoDictionary[@"CFBundleIdentifier"];
    if (bundleIdentifier) {
        info[@"bundleIdentifier"] = bundleIdentifier;
    }

    NSString *versionCode = infoDictionary[@"CFBundleVersion"];
    if (versionCode) {
        info[@"bundleVersion"] = versionCode;
    }

    NSString *modelIdentifier = deviceModelIdentifier();
    if (modelIdentifier) {
        info[@"model"] = modelIdentifier;
    }

    return info;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(requestEntropy) {
    NSString *hexStr = getRandomBytes();
    return hexStr;
}

RCT_EXPORT_METHOD(requestEntropyAsync:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *hexStr = getRandomBytes();
    resolve(hexStr);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getNativeConstants) {
    NSMutableDictionary *nativeDirs = [NSMutableDictionary new];
    NSArray<NSString *> *caches = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, true);
    if (caches != nil && [caches count] != 0 ) {
        nativeDirs[@"CacheDir"] = caches[0];
    }
    NSArray<NSString *> *documents = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, true);
    if (documents != nil && [documents count] != 0 ) {
        nativeDirs[@"DocumentDir"] = documents[0];
    }

    return nativeDirs;
}

RCT_EXPORT_METHOD(exists:(NSString *)path
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject) {
    BOOL exists = [NSFileManager.defaultManager fileExistsAtPath:path];
    resolve(@(exists));
}

RCT_EXPORT_METHOD(isDir:(NSString *)path
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject) {
    BOOL isDir;
    BOOL exists = [NSFileManager.defaultManager fileExistsAtPath:path isDirectory:&isDir];
    resolve(@(exists && isDir));
}

RCT_EXPORT_METHOD(ls:(NSString *)path
   resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    NSArray<NSString *> *contents = [NSFileManager.defaultManager contentsOfDirectoryAtPath:path error:&error];
    if (error != nil) {
        reject(@"ENOENT", @"Directory does not exist", error);
    } else {
        resolve(contents);
    }
}

RCT_EXPORT_METHOD(mkdir:(NSString *)path
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    BOOL result = [NSFileManager.defaultManager createDirectoryAtPath:path withIntermediateDirectories:true attributes:nil error:&error];
    if (error != nil) {
        reject(@"EIO", @"Failed to create directory", error);
    } else {
        resolve(@(result));
    }
}

RCT_EXPORT_METHOD(readFile:(NSString *)path
        encoding:(NSString *)encoding
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    if ([encoding isEqualToString:@"utf8"]) {
        NSString *fileString = [[NSString alloc] initWithContentsOfFile:path encoding:NSUTF8StringEncoding error:&error];
        if (error != nil) {
            reject(@"EIO", @"Failed to read file", error);
        } else {
            resolve(fileString);
        }
    } else if ([encoding isEqualToString:@"base64"]) {
        NSData *fileData = [[NSData alloc] initWithContentsOfFile:path];
        if (fileData != nil) {
            resolve([fileData base64EncodedStringWithOptions:0]);
        } else {
            reject(@"ERR", @"Failed to read file, invalid base64", nil);
        }
    }
}

RCT_EXPORT_METHOD(unlink:(NSString *)path
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    BOOL result = [NSFileManager.defaultManager removeItemAtPath:path error:&error];
    if (error != nil) {
        reject(@"EIO", @"Failed to remove file", error);
    } else if (result) {
        resolve(nil);
    } else {
        reject(@"ENOENT", @"Failed to delete file/directory", nil);
    }
}

RCT_EXPORT_METHOD(writeFile:(NSString *)path
             data:(NSString *)data
         encoding:(NSString *)encoding
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject) {
    if ([encoding isEqualToString:@"utf8"]) {
        NSError *error;
        [data writeToFile:path atomically:NO encoding:NSUTF8StringEncoding error:&error];
        if (error != nil) {
            reject(@"EIO", @"Failed to write file", error);
        } else {
            resolve(nil);
        }
    } else if ([encoding isEqualToString:@"base64"]) {
        NSURL *fileURL = [NSURL fileURLWithPath:path];
        NSData *nsData = [[NSData alloc] initWithBase64EncodedString:data options:NSDataBase64DecodingIgnoreUnknownCharacters];
        if (nsData != nil) {
            [nsData writeToURL:fileURL atomically:NO];
            resolve(nil);
        } else {
            reject(@"ERR", @"Failed to write to '\(path)', invalid base64.", nil);
        }
    }
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isNativePerformanceAvailable) {
    return [NSNumber numberWithBool:BugsnagReactNativePerformanceCrossTalkAPIClient.isInitialized];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(attachToNativeSDK) {
    if (!BugsnagReactNativePerformanceCrossTalkAPIClient.isInitialized) {
        return nil;
    }

    BugsnagPerformanceConfiguration *nativeConfig = [BugsnagReactNativePerformanceCrossTalkAPIClient.sharedInstance getConfiguration];
    if (nativeConfig == nil) {
        return nil;
    }

    if (longRunningSpansTimer == nil) {
        longRunningSpansTimer = [NSTimer scheduledTimerWithTimeInterval:hourInSeconds
                                                                target:self
                                                              selector:@selector(discardLongRunningSpans)
                                                              userInfo:nil
                                                               repeats:YES];
    }

    NSMutableDictionary *config = [NSMutableDictionary new];
    config[@"apiKey"] = nativeConfig.apiKey;
    config[@"endpoint"] = [nativeConfig.endpoint absoluteString];
    config[@"releaseStage"] = nativeConfig.releaseStage;
    config[@"serviceName"] = nativeConfig.serviceName;
    config[@"attributeCountLimit"] = [NSNumber numberWithUnsignedInteger: nativeConfig.attributeCountLimit];
    config[@"attributeStringValueLimit"] = [NSNumber numberWithUnsignedInteger: nativeConfig.attributeStringValueLimit];
    config[@"attributeArrayLengthLimit"] = [NSNumber numberWithUnsignedInteger: nativeConfig.attributeArrayLengthLimit];

    if (nativeConfig.samplingProbability != nil) {
        config[@"samplingProbability"] = nativeConfig.samplingProbability;
    }

    if (nativeConfig.appVersion != nil) {
        config[@"appVersion"] = nativeConfig.appVersion;
    }

    if (nativeConfig.enabledReleaseStages != nil && nativeConfig.enabledReleaseStages.count > 0) {
        config[@"enabledReleaseStages"] = [nativeConfig.enabledReleaseStages allObjects];
    }

    return config;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(startNativeSpan:(NSString *)name
                options:(NSDictionary *)options) {

    // native spans are always first class and should never become the current context
    BugsnagPerformanceSpanOptions *spanOptions = [BugsnagReactNativePerformanceCrossTalkAPIClient.sharedInstance newSpanOptions];
    spanOptions.firstClass = BSGFirstClassYes;
    spanOptions.makeCurrentContext = NO;
    spanOptions.instrumentRendering = BSGInstrumentRenderingYes;
    spanOptions.parentContext = nil;
    
    // Start times are passsed from JS as unix nanosecond timestamps
    NSNumber *startTime = options[@"startTime"];
    spanOptions.startTime = [NSDate dateWithTimeIntervalSince1970:([startTime doubleValue] / NSEC_PER_SEC)];
    
    NSDictionary *parentContext = options[@"parentContext"];
    if (parentContext != nil) {
        NSString *parentSpanId = parentContext[@"id"];
        NSString *parentTraceId = parentContext[@"traceId"];

        uint64_t spanId = hexStringToUInt64(parentSpanId);
        uint64_t traceIdHi = hexStringToUInt64([parentTraceId substringToIndex:traceIdMidpoint]);
        uint64_t traceIdLo = hexStringToUInt64([parentTraceId substringFromIndex:traceIdMidpoint]);

        spanOptions.parentContext = [BugsnagReactNativePerformanceCrossTalkAPIClient.sharedInstance newSpanContext:traceIdHi traceIdLo:traceIdLo spanId:spanId];
    }
    
    BugsnagPerformanceSpan *nativeSpan = [BugsnagReactNativePerformanceCrossTalkAPIClient.sharedInstance startSpan:name options:spanOptions];
    [nativeSpan.attributes removeAllObjects];
    
    NSString *spanId = [NSString stringWithFormat:@"%llx", nativeSpan.spanId];
    NSString *traceId = [NSString stringWithFormat:@"%llx%llx", nativeSpan.traceIdHi, nativeSpan.traceIdLo];

    @synchronized (openSpans) {
        openSpans[[spanId stringByAppendingString:traceId]] = nativeSpan;
    }

    NSMutableDictionary *span = [NSMutableDictionary new];
    span[@"name"] = nativeSpan.name;
    span[@"id"] = spanId;
    span[@"traceId"] = traceId;
    span[@"startTime"] = [NSNumber numberWithDouble: [nativeSpan.startTime timeIntervalSince1970] * NSEC_PER_SEC];
    if (nativeSpan.parentId > 0) {
        span[@"parentSpanId"] = [NSString stringWithFormat:@"%llx", nativeSpan.parentId];
    }
    
    return span;
}

RCT_EXPORT_METHOD(endNativeSpan:(NSString *)spanId
                traceId:(NSString *)traceId
                endTime:(double)endTime
                attributes:(NSDictionary *)attributes
                resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject) {
    NSString *spanKey = [spanId stringByAppendingString:traceId];

    BugsnagPerformanceSpan *nativeSpan;
    @synchronized (openSpans) {
        nativeSpan = openSpans[spanKey];
        if (nativeSpan != nil) {
            [openSpans removeObjectForKey:spanKey];
        }
    }

    if (nativeSpan != nil) {
        // Set native span attributes from JS values
        [ReactNativeSpanAttributes setNativeAttributes:nativeSpan.attributes fromJSAttributes:attributes];

        // We need to reinstate the bugsnag.sampling.p attribute here as it might not be re-populated on span end
        nativeSpan.attributes[@"bugsnag.sampling.p"] = @(nativeSpan.samplingProbability);
        
        // If the end time is later than the current end time, update it
        NSDate *nativeEndTime = [NSDate dateWithTimeIntervalSince1970: endTime / NSEC_PER_SEC];
        if ([nativeEndTime timeIntervalSinceDate:nativeSpan.endTime] > 0) {
            [nativeSpan markEndTime:nativeEndTime];
        }
        
        [nativeSpan sendForProcessing];
    }

    resolve(nil);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(markNativeSpanEndTime:(NSString *)spanId traceId:(NSString *)traceId endTime:(double)endTime) {
    @synchronized (openSpans) {
        BugsnagPerformanceSpan *nativeSpan = openSpans[[spanId stringByAppendingString:traceId]];
        if (nativeSpan != nil) {
            NSDate *nativeEndTime = [NSDate dateWithTimeIntervalSince1970: endTime / NSEC_PER_SEC];
            [nativeSpan markEndTime:nativeEndTime];
        }
    }
    
    return nil;
}

RCT_EXPORT_METHOD(discardNativeSpan:(NSString *)spanId
                traceId:(NSString *)traceId
                resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject) {
    NSString *spanKey = [spanId stringByAppendingString:traceId];
    @synchronized (openSpans) {
        BugsnagPerformanceSpan *nativeSpan = openSpans[spanKey];    
        if (nativeSpan != nil) {
            [openSpans removeObjectForKey:spanKey];
            [nativeSpan abortUnconditionally];
        }
    }

    resolve(nil);
}

- (void)discardLongRunningSpans {
    NSDate *oneHourAgo = [NSDate dateWithTimeIntervalSinceNow:-hourInSeconds];
    NSMutableArray *keysToRemove = [NSMutableArray new];
    
    @synchronized (openSpans) {
        for (NSString *key in openSpans) {
            BugsnagPerformanceSpan *span = openSpans[key];
            if ([span.startTime compare:oneHourAgo] == NSOrderedAscending) {
                [keysToRemove addObject:key];
            }
        }
        
        [openSpans removeObjectsForKeys:keysToRemove];
    }
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBugsnagPerformanceSpecJSI>(params);
}
#endif

@end
