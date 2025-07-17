#import "BugsnagJavascriptSpanControl.h"
#import "BugsnagJavascriptSpansPlugin+Private.h"
#import <stdlib.h>

static NSString * const idTransactionKey = @"id";
static NSString * const nameTransactionKey = @"name";
static NSString * const endTimeTransactionKey = @"endTime";
static NSString * const isEndedTransactionKey = @"isEnded";
static NSString * const attributesTransactionKey = @"attributes";
static NSString * const attributeNameKey = @"name";
static NSString * const attributeValueKey = @"value";

@interface BugsnagJavascriptSpanTransaction ()

- (instancetype)initWithSpanName:(NSString *)spanName;

@end

@implementation BugsnagJavascriptSpanTransaction

NSMutableDictionary *updateEvent;

BOOL isOpen = YES;

- (instancetype)initWithSpanName:(NSString *)spanName; {
    self = [super init];
    if (self) {
        updateEvent = [NSMutableDictionary dictionaryWithDictionary:@{
            nameTransactionKey: spanName,
            isEndedTransactionKey: @NO
        }];
    }
    return self;
}

- (void)end {
    if(!isOpen) {
        return;
    }

    [self endWithEndTime:[NSDate date]];
}

- (void)endWithEndTime:(NSDate *)endTime {
    if (!isOpen) {
        return;
    }

    NSTimeInterval currentTime = [endTime timeIntervalSince1970];
    NSNumber *unixNanos = @((double)(currentTime * NSEC_PER_SEC));
    updateEvent[endTimeTransactionKey] = unixNanos;
    updateEvent[isEndedTransactionKey] = @YES;
}

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value {
    if (!isOpen || attributeName == nil || ![self isValidAttribute:value]) {
        return;
    }

    NSMutableArray *attributes = updateEvent[attributesTransactionKey];
    if (!attributes) {
        attributes = [NSMutableArray array];
        updateEvent[attributesTransactionKey] = attributes;
    }

    NSDictionary *attribute = @{
      attributeNameKey: attributeName,
      attributeValueKey: value ?: [NSNull null]
    };
    [attributes addObject:attribute];
}

- (void)commit:(OnSpanUpdatedCallback)callback {
    if (!isOpen) {
        callback(NO);
        return;
    }

    isOpen = NO;
    BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
    if (!plugin) {
        callback(NO);
        return;
    }
  
    int eventId = [plugin registerSpanUpdateCallback:callback];
    updateEvent[idTransactionKey] = @(eventId);
    [plugin sendSpanUpdateEvent:updateEvent];
}

- (BOOL)isValidAttribute:(_Nullable id)value {
  if (value == nil || [value isKindOfClass:[NSString class]] || [value isKindOfClass:[NSNumber class]]) {
    return YES;
  }
  
  if ([value isKindOfClass:[NSArray class]]) {
    NSUInteger idx = [value indexOfObjectPassingTest:^BOOL(id obj, NSUInteger idx, BOOL *stop) {
      if ([obj isKindOfClass:[NSString class]] || [obj isKindOfClass:[NSNumber class]]) {
        return NO;
      }
      
      // stop the iteration if we find an invalid object
      *stop = YES;
      return YES;
    }];
    
    return idx == NSNotFound; // means all objects are valid
  }
  
  return NO;
}

@end

@implementation BugsnagJavascriptSpanControl

NSString *spanName;

- (instancetype)initWithSpanName:(NSString *)name {
    self = [super init];
    if (self) {
        spanName = name;
    }
    return self;
}

- (BugsnagJavascriptSpanTransaction *)createUpdateTransaction {
    return [[BugsnagJavascriptSpanTransaction alloc] initWithSpanName:spanName];
}

- (void)getSpanContext:(RemoteSpanContextCallback)callback {
    BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
    if (!plugin) {
        callback(nil);
        return;
    }

    int eventId = [plugin registerSpanContextCallback:callback];
  
    NSDictionary *contextEvent = @{
      idTransactionKey: @(eventId),
      nameTransactionKey: spanName,
    };
  
    [plugin sendSpanContextEvent:contextEvent];
}

@end
