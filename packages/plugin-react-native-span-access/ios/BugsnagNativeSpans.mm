#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import "BugsnagNativeSpansPlugin+Private.h"
#import "BugsnagJavascriptSpansPlugin+Private.h"
#import "BugsnagNativeSpans.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "BugsnagNativeSpansSpec.h"
#endif

@implementation BugsnagNativeSpans

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"bugsnag:spanUpdate", @"bugsnag:spanContext"];
}

- (void)startObserving
{
  // Register this instance with the BugsnagJavascriptSpansPlugin
  BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
  if (plugin) {
      [plugin setEventEmitter:self];
  }
}

- (void)stopObserving
{
  // Unregister this instance from the BugsnagJavascriptSpansPlugin
  BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
  if (plugin) {
    [plugin setEventEmitter:nil];
  }
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getSpanIdByName:(NSString *)spanName) {
    BugsnagNativeSpansPlugin *plugin = [BugsnagNativeSpansPlugin singleton];
    if (!plugin) {
        return nil;
    }

    BugsnagPerformanceSpan *span = nil;
    @synchronized (plugin) {
        span = plugin.spansByName[spanName];
    }

    if (!span) {
        return nil;
    }

    NSDictionary *returnedId = @{
        @"spanId": [NSString stringWithFormat:@"%016llx", span.spanId],
        @"traceId": [NSString stringWithFormat:@"%016llx%016llx", span.traceIdHi, span.traceIdLo]
    };

    return returnedId;
}

RCT_EXPORT_METHOD(updateSpan:(NSDictionary *)spanId
                     updates:(NSDictionary *)updates
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject)
{
    BugsnagNativeSpansPlugin *plugin = [BugsnagNativeSpansPlugin singleton];
    if (!plugin) {
        resolve(@NO);
        return;
    }

    NSString *id = spanId[@"spanId"];
    NSString *traceId = spanId[@"traceId"];

    if (!id || !traceId) {
        resolve(@NO);
        return;
    }

    NSString *spanIdKey = [NSString stringWithFormat:@"%@:%@", id, traceId];
    BugsnagPerformanceSpan *span = nil;
    @synchronized (plugin) {
        span = plugin.spansById[spanIdKey];
    }

    if (!span) {
        resolve(@NO);
        return;
    }

    NSArray *attributes = updates[@"attributes"];
    if (attributes) {
        [self updateSpanAttributes:attributes span:span];
    }

    if (updates[@"isEnded"] == @YES) {
        [self endSpan:updates span:span];
    }

    resolve(@YES);
}

RCT_EXPORT_METHOD(reportSpanUpdateResult:(double)eventId
                  result:(BOOL)result
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
{
    BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
    if (plugin) {
        [plugin onRemoteSpanUpdated:(int)eventId withResult:result];
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(reportSpanContextResult:(double)eventId
                  result:(NSString *)result
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
{
    BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
    if (plugin) {
        [plugin onRemoteSpanContextReceived:(int)eventId withContext:result];
    }
    resolve(nil);
}

- (void)endSpan:(NSDictionary *)updates span:(BugsnagPerformanceSpan *)span {
    NSNumber *timestampString = updates[@"endTime"];
    if (timestampString) {
        double endTimestampValue = [timestampString doubleValue];
        NSDate *endTimestamp = [NSDate dateWithTimeIntervalSince1970:(endTimestampValue / NSEC_PER_SEC)];
        [span endWithEndTime:endTimestamp];
    } else {
        [span end];
    }
}

- (void)updateSpanAttributes:(NSArray *)attributes span:(BugsnagPerformanceSpan *)span {
    for (NSDictionary *attribute in attributes) {
        NSString *name = attribute[@"name"];
        id value = attribute[@"value"];
        if (name) {
            [BugsnagNativeSpans setSpanAttribute:name withValue:value span:span];
        }
    }
}

+ (void)setSpanAttribute:(NSString *)name
               withValue:(id)value
                    span:(BugsnagPerformanceSpan *)span
{
    if ([value isKindOfClass:[NSNumber class]]) {
        if ([self isBoolean:value]) {
            [span setAttribute:name withValue:value];
            return;
        }

        double doubleValue = [value doubleValue];
        long longValue = (long)doubleValue;
        if (doubleValue == longValue) {
            [span setAttribute:name withValue:@(longValue)];
        } else {
            [span setAttribute:name withValue:@(doubleValue)];
        }
    } else if ([value isKindOfClass:[NSArray class]]) {
        [span setAttribute:name withValue:[self normaliseAttributeArray:value]];
    } else {
        [span setAttribute:name withValue:value];
    }
}

+ (NSArray*)normaliseAttributeArray:(NSArray *)array {
    NSUInteger size = array.count;
    if (size == 0) {
        return @[];
    }

    if ([self isNumberArray:array]) {
        BOOL allIntegers = YES;
        NSMutableArray *longValues = [NSMutableArray arrayWithCapacity:size];
        for (NSNumber *number in array) {
            double doubleValue = [number doubleValue];
            long longValue = (long)doubleValue;
            if (doubleValue != longValue) {
                allIntegers = NO;
                break;
            }

            [longValues addObject:@(longValue)];
        }

        if (allIntegers) {
            return longValues;
        } else {
            NSMutableArray *doubleValues = [NSMutableArray arrayWithCapacity:size];
            for (NSNumber *number in array) {
                [doubleValues addObject:@([number doubleValue])];
            }
            return doubleValues;
        }
    } else {
        return array;
    }
}

+ (BOOL)isNumberArray:(NSArray *)array {
    id firstValue = array[0];
    if ([firstValue isKindOfClass:[NSNumber class]]) {
        return ![self isBoolean:firstValue];
    }

    return NO;
}

+ (BOOL) isBoolean:(NSNumber *)value {
    return CFGetTypeID((__bridge CFTypeRef)(value)) == CFBooleanGetTypeID();
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr <facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBugsnagNativeSpansSpecJSI>(params);
}
#endif

@end
