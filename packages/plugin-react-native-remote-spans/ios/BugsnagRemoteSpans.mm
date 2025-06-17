#import "BugsnagRemoteSpans.h"
#import "BugsnagRemoteSpansSpec.h"

@implementation BugsnagRemoteSpans

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getSpanIdByName:(NSString *)spanName) {
  return nil;
}

RCT_EXPORT_METHOD(updateSpan:(NSDictionary *)spanId
                updates:(NSDictionary *)updates
                resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject) {
  resolve(nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBugsnagRemoteSpansSpecJSI>(params);
}

@end
