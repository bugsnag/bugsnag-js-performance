#import "BugsnagJavascriptSpanControl.h"
#import "BugsnagJavascriptSpansPlugin+Private.h"
#import <stdlib.h>

typedef void (^OnCommitBlock)(void);

@interface BugsnagJavascriptSpanTransaction ()

@property (nonatomic, strong, readonly) NSMutableDictionary *transaction;
@property (nonatomic, copy) void (^onCommit)(void);

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

- (instancetype)initWithDictionary:(NSMutableDictionary *)dictionary onCommit:(OnCommitBlock)onCommit {
    self = [super init];
    if (self) {
        _transaction = dictionary;
        _onCommit = onCommit;
    }
    return self;
}

- (void)end {
    [self endWithEndTime:[NSDate date]];
}
    

- (void)endWithEndTime:(NSDate *)endTime {
    NSTimeInterval currentTime = [endTime timeIntervalSince1970];
    NSNumber *unixNanos = @((double)(currentTime * NSEC_PER_SEC));
    self.transaction[endTimeTransactionKey] = unixNanos;
    self.transaction[isEndedTransactionKey] = @YES;
    
    // Call the onCommit block if it exists
    if (self.onCommit) {
        self.onCommit();
    }
}

- (void)setAttribute:(NSString *)attributeName withValue:(_Nullable id)value {
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

- (void)commit {
    // Call the onCommit block if it exists
    if (self.onCommit) {
        self.onCommit();
    }
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
    // Create transaction dictionary to accumulate changes
    uint32_t result;
    arc4random_buf(&result, sizeof(result));
    NSNumber *eventId = @(result);
  
    NSMutableDictionary *updateEvent = [NSMutableDictionary dictionaryWithDictionary:@{
        idTransactionKey: eventId,
        nameTransactionKey: spanName,
        isEndedTransactionKey: @NO
    }];
    
    BugsnagJavascriptSpanTransaction *transaction = [[BugsnagJavascriptSpanTransaction alloc] initWithDictionary:updateEvent onCommit:^{
        BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
        if (plugin) {
            [plugin sendSpanUpdateEvent:updateEvent];
        }
    }];
    
    return transaction;
}
@end
