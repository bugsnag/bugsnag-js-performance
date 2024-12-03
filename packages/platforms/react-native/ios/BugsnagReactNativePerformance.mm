#import "BugsnagReactNativePerformance.h"
#import <sys/sysctl.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "BugsnagReactNativePerformanceSpec.h"
#endif

@implementation BugsnagReactNativePerformance

RCT_EXPORT_MODULE()

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
    nativeDirs[@"CacheDir"] = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true).first!;
    nativeDirs[@"DocumentDir"] = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first!;
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
    BOOL* isDir;
    BOOL exists = [NSFileManager.defaultManager fileExistsAtPath:path isDirectory:isDir];
    resolve(@(exists && isDir));
}

RCT_EXPORT_METHOD(ls:(NSString *)path
   resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    NSArray<NSString *> *contents = [NSFileManager.defaultManager contentsOfDirectoryAtPath:path error:error];
    if error != nil {
        reject(@"ENOENT", @"Directory does not exist", error);
    } else {
        resolve(contents);
    }
}

RCT_EXPORT_METHOD(mkdir:(NSString *)path
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    BOOL result = [NSFileManager.defaultManager createDirectoryAtPath:path withIntermediateDirectories:true attributes:nil error:error];
    if error != nil {
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
    if encoding == "utf8" {
        NSString *fileString = [NSString initWithContentsOfFile:path encoding:NSUTF8StringEncoding error:error];
        if error != nil {
            reject(@"EIO", @"Failed to read file", error);
        } else {
            resolve(fileString);
        }
    } else if encoding == "base64" {
        NSData *fileData = [NSData initWithContentsOfFile:path];
        if fileData != nil {
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
    BOOL result = [NSFileManager.defaultManager removeItemAtPath:path error:error];
    if error != nil {
        reject(@"EIO", @"Failed to remove file", error);
    } else if result{
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
    if encoding == "utf8" {
        NSError *error;
        [data writeToFile:path atomically:NO encoding:NSUTF8StringEncoding error:error];
        if error != nil {
            reject(@"EIO", @"Failed to write file", error);
        } else {
            resolve(nil);
        }
    } else if encoding == "base64" {
        NSURL *fileURL = [NSURL fileURLWithPath:path];
        NSData *nsData = [NSData initWithBase64EncodedString:data options:NSDataBase64DecodingIgnoreUnknownCharacters];
        if nsData != nil {
            [nsData writeToURL:fileURL atomically:NO];
            resolve(nil);
        } else {
            reject(@"ERR", @"Failed to write to '\(path)', invalid base64.", nil);
        }
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
