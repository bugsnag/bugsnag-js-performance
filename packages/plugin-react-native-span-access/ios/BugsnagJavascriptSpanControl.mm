#import "BugsnagJavascriptSpanControl.h"
#import "BugsnagJavascriptSpansPlugin+Private.h"
#import <stdlib.h>

typedef void (^OnCommitBlock)(OnSpanUpdatedCallback callback);

@interface BugsnagJavascriptSpanTransaction ()

@property (nonatomic, strong, readonly) NSMutableDictionary *transaction;
@property (nonatomic, copy) OnCommitBlock onCommit;

- (instancetype)initWithDictionary:(NSMutableDictionary *)dictionary onCommit:(OnCommitBlock)onCommit;

@end

static NSString * const idTransactionKey = @"id";
static NSString * const nameTransactionKey = @"name";
static NSString * const endTimeTransactionKey = @"endTime";
static NSString * const isEndedTransactionKey = @"isEnded";
static NSString * const attributesTransactionKey = @"attributes";
static NSString * const attributeNameKey = @"name";
static NSString * const attributeValueKey = @"value";

@implementation BugsnagJavascriptSpanTransaction

BOOL isOpen = YES;

- (instancetype)initWithDictionary:(NSMutableDictionary *)dictionary onCommit:(OnCommitBlock)onCommit {
    self = [super init];
    if (self) {
        _transaction = dictionary;
        _onCommit = onCommit;
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
    if(!isOpen) {
        return;
    }

    NSTimeInterval currentTime = [endTime timeIntervalSince1970];
    NSNumber *unixNanos = @((double)(currentTime * NSEC_PER_SEC));
    self.transaction[endTimeTransactionKey] = unixNanos;
    self.transaction[isEndedTransactionKey] = @YES;
}

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value {
    if(!isOpen) {
        return;
    }

    NSMutableArray *attributes = self.transaction[attributesTransactionKey];
    if (!attributes) {
        attributes = [NSMutableArray array];
        self.transaction[attributesTransactionKey] = attributes;
    }

    NSDictionary *attribute = @{
      attributeNameKey: attributeName,
      attributeValueKey: value ?: [NSNull null]
    };
    [attributes addObject:attribute];
}

- (void)commit:(OnSpanUpdatedCallback)callback {
    if(!isOpen) {
        callback(NO);
        return;
    }

    isOpen = NO;
    self.onCommit(callback);
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
    NSMutableDictionary *updateEvent = [NSMutableDictionary dictionaryWithDictionary:@{
        nameTransactionKey: spanName,
        isEndedTransactionKey: @NO
    }];
    
    BugsnagJavascriptSpanTransaction *transaction = [[BugsnagJavascriptSpanTransaction alloc] initWithDictionary:updateEvent onCommit:^(OnSpanUpdatedCallback callback) {
        BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
        if (plugin) {
            int eventId = [plugin registerSpanUpdateCallback:callback];
            updateEvent[idTransactionKey] = @(eventId);
            [plugin sendSpanUpdateEvent:updateEvent];
        } else {
            callback(NO);
        }
    }];
    
    return transaction;
}
@end
