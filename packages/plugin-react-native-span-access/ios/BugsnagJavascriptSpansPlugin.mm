#import "BugsnagJavascriptSpansPlugin+Private.h"
#import "BugsnagJavascriptSpanControlProvider.h"
#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import <BugsnagPerformance/BugsnagPerformancePluginContext.h>
#import <BugsnagPerformance/BugsnagPerformanceRemoteSpanContext.h>

@interface CallbackRegistry : NSObject
- (int)registerCallback:(id)callback;
- (id)takeCallback:(int)callbackId;
@end

@implementation CallbackRegistry {
    NSMutableDictionary *_callbacks;
    int _nextCallbackId;
}

- (instancetype)init {
    if (self = [super init]) {
        _callbacks = [NSMutableDictionary new];
        _nextCallbackId = 0;
    }
    return self;
}

- (int)registerCallback:(id)callback {
    @synchronized (_callbacks) {
        int callbackId = _nextCallbackId++;
        _callbacks[@(callbackId)] = callback;
        return callbackId;
    }
}

- (id)takeCallback:(int)callbackId {
    @synchronized (_callbacks) {
        id callback = [_callbacks objectForKey:@(callbackId)];
        if (!callback) {
            return nil;
        }
        [_callbacks removeObjectForKey:@(callbackId)];
        return callback;
    }
}

@end

@interface BugsnagJavascriptSpansPlugin ()

@property (nonatomic, weak) RCTEventEmitter *eventEmitter;

@end

@implementation BugsnagJavascriptSpansPlugin

static BugsnagJavascriptSpansPlugin *_sharedInstance = nil;

CallbackRegistry *_spanUpdateCallbacks;

CallbackRegistry *_spanContextCallbacks;

+ (id)singleton {
    return _sharedInstance;
}

- (void)installWithContext:(BugsnagPerformancePluginContext *)context {
    _sharedInstance = self;
    _spanUpdateCallbacks = [CallbackRegistry new];
    _spanContextCallbacks = [CallbackRegistry new];
    BugsnagJavascriptSpanControlProvider *spanControlProvider = [BugsnagJavascriptSpanControlProvider new];
    [context addSpanControlProvider:spanControlProvider];
}

- (void)start {
}

- (void)setEventEmitter:(RCTEventEmitter *)eventEmitter {
    _eventEmitter = eventEmitter;
}

- (int)registerSpanUpdateCallback:(OnSpanUpdatedCallback)callback {
    return [_spanUpdateCallbacks registerCallback:callback];
}

- (void)sendSpanUpdateEvent:(NSDictionary *)event {
    @synchronized (self) {
      if (_eventEmitter) {
          [_eventEmitter sendEventWithName:@"bugsnag:spanUpdate" body:event];
      }
    }
}

- (void)onRemoteSpanUpdated:(int)eventId withResult:(BOOL)result {
    OnSpanUpdatedCallback callback = [_spanUpdateCallbacks takeCallback:eventId];
    if (callback) {
        callback(result);
    }
}

- (int)registerSpanContextCallback:(RemoteSpanContextCallback)callback {
    return [_spanContextCallbacks registerCallback:callback];
}

- (void)sendSpanContextEvent:(NSDictionary *)event {
    @synchronized (self) {
      if (_eventEmitter) {
          [_eventEmitter sendEventWithName:@"bugsnag:retrieveSpanContext" body:event];
      }
    }
}

- (void)onRemoteSpanContextReceived:(int)eventId withContext:(NSString *)context {
    RemoteSpanContextCallback callback = [_spanContextCallbacks takeCallback:eventId];
    if (callback) {
        callback([BugsnagPerformanceRemoteSpanContext contextWithTraceParentString:context]);
    }
}

@end
