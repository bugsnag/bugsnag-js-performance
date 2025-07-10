#import "BugsnagJavascriptSpanControl.h"
#import "BugsnagJavascriptSpansPlugin+Private.h"
#import <stdlib.h>

@interface BugsnagJavascriptSpanMutator ()

@property (nonatomic, strong, readonly) NSMutableDictionary *transaction;

- (instancetype)initWithTransaction:(NSMutableDictionary *)transaction;

@end

static NSString * const idTransactionKey = @"id";
static NSString * const nameTransactionKey = @"name";
static NSString * const endTimeTransactionKey = @"endTime";
static NSString * const isEndedTransactionKey = @"isEnded";
static NSString * const attributesTransactionKey = @"attributes";
static NSString * const attributeNameKey = @"name";
static NSString * const attributeValueKey = @"value";

@implementation BugsnagJavascriptSpanMutator

- (instancetype)initWithTransaction:(NSMutableDictionary *)transaction {
    self = [super init];
    if (self) {
        _transaction = transaction;
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

@end

@interface BugsnagJavascriptSpanControl ()
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

- (void)updateSpanWithUpdate:(BugsnagJavascriptSpanUpdateBlock)updateBlock {
    // Create transaction dictionary to accumulate changes
    uint32_t result;
    arc4random_buf(&result, sizeof(result));
    NSNumber *eventId = @(result);
  
    NSMutableDictionary *transaction = [NSMutableDictionary dictionaryWithDictionary:@{
        idTransactionKey: eventId,
        nameTransactionKey: spanName,
        isEndedTransactionKey: @NO
    }];
    
    // Create mutator and let the update block modify the transaction
    BugsnagJavascriptSpanMutator *mutator = [[BugsnagJavascriptSpanMutator alloc] initWithTransaction:transaction];
    updateBlock(mutator);
        
    // Emit the update event via the plugin instance
    BugsnagJavascriptSpansPlugin *plugin = [BugsnagJavascriptSpansPlugin singleton];
    if (plugin) {
      [plugin sendSpanUpdateEvent:transaction];
    }
}

@end
