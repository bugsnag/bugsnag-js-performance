
#import "BugsnagReactNativeAppStartPlugin.h"
#import <BugsnagPerformance/BugsnagPerformancePluginContext.h>
#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanCondition.h>
#import <BugsnagPerformance/BugsnagPerformanceSpanContext.h>

static const NSTimeInterval kDefaultSpanBlockTimeoutInterval = 5; // 5s default timeout

@interface BugsnagReactNativeAppStartPlugin ()
@property (nonatomic, strong) NSString *currentSpanId;
@property (nonatomic, strong) BugsnagPerformanceSpanCondition *currentCondition;
@property (atomic, assign) BOOL appStartComplete;
@property (nonatomic, assign) NSTimeInterval spanBlockTimeoutInterval;
@end

// Attributes are in the private header for BugsnagPerformanceSpan, 
// but are needed to check span category, so we declare them here
@interface BugsnagPerformanceSpan ()
@property (nonatomic,readonly) NSMutableDictionary *attributes;
@end

@implementation BugsnagReactNativeAppStartPlugin

static BugsnagReactNativeAppStartPlugin *_sharedInstance = nil;

- (instancetype)init {
    return [self initWithTimeout:kDefaultSpanBlockTimeoutInterval];
}

- (instancetype)initWithTimeout:(NSTimeInterval)timeout {
    if (self = [super init]) {
        _spanBlockTimeoutInterval = timeout;
    }
    return self;
}

+ (id)singleton {
    return _sharedInstance;
}

- (void)installWithContext:(BugsnagPerformancePluginContext *)context {
     _sharedInstance = self;
    __weak BugsnagReactNativeAppStartPlugin *weakSelf = self;
    
    // Add span start callback with high priority (equivalent to NORM_PRIORITY + 1)
    BugsnagPerformanceSpanStartCallback spanStartCallback = ^(BugsnagPerformanceSpan *span) {
        [weakSelf onSpanStart:span];
    };
    
    // Add span end callback with low priority (equivalent to NORM_PRIORITY - 1)  
    BugsnagPerformanceSpanEndCallback spanEndCallback = ^(BugsnagPerformanceSpan *span) {
        return [weakSelf onSpanEnd:span];
    };
    
    [context addOnSpanStartCallback:spanStartCallback priority:BugsnagPerformancePriorityHigh];
    [context addOnSpanEndCallback:spanEndCallback priority:BugsnagPerformancePriorityLow];
}

- (void)start {
    // Plugin start implementation
}

- (NSString *)getAppStartParent {
    BugsnagPerformanceSpanCondition *condition;
    @synchronized (self) {
        condition = _currentCondition;
    }
    
    if (condition) {
        BugsnagPerformanceSpanContext *nativeParent = [condition upgrade];
        if (nativeParent) {
            return [nativeParent encodedAsTraceParent];
        }
    }
    return nil;
}

- (void)endAppStart:(NSDate *)endTime {
    BugsnagPerformanceSpanCondition *condition;
    @synchronized (self) {
        condition = _currentCondition;
        _currentCondition = nil;
        _currentSpanId = nil;
        _appStartComplete = YES;
    }
    
    if (condition) {
        [condition closeWithEndTime:endTime];
    }
}

- (void)onSpanStart:(BugsnagPerformanceSpan *)span {
    // Check app start completion status (atomic read)
    if (_appStartComplete) {
        return;
    }
    
    // Check if this is a view_load span by examining attributes
    NSString *category = span.attributes[@"bugsnag.span.category"];
    if (![category isEqualToString:@"view_load"]) {
        return;
    }
    
    // Block the span (outside synchronized block)
    BugsnagPerformanceSpanCondition *spanCondition = [span blockWithTimeout:_spanBlockTimeoutInterval];
    
    // Update shared state atomically
    @synchronized (self) {
        // Cancel any existing condition
        if (_currentCondition) {
            [_currentCondition cancel];
        }
        
        // Only set current condition if block() returned a non-null value
        if (spanCondition) {
            _currentSpanId = [span encodedAsTraceParent];
            _currentCondition = spanCondition;
        }
    }
}

- (BOOL)onSpanEnd:(BugsnagPerformanceSpan *)span {
    NSString *spanId = [span encodedAsTraceParent];
    
    BugsnagPerformanceSpanCondition *conditionToCancel = nil;
    @synchronized (self) {
        if (_currentCondition && [spanId isEqualToString:_currentSpanId]) {
            conditionToCancel = _currentCondition;
            _currentCondition = nil;
            _currentSpanId = nil;
        }
    }
    
    if (conditionToCancel) {
        [conditionToCancel cancel];
    }
    
    return YES;
}

@end