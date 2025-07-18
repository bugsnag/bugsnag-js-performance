#import "BugsnagJavascriptSpansPlugin+Private.h"
#import "BugsnagJavascriptSpanControlProvider.h"
#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import <BugsnagPerformance/BugsnagPerformancePluginContext.h>

@interface BugsnagJavascriptSpansPlugin ()

@property (nonatomic, weak) RCTEventEmitter *eventEmitter;

@end

@implementation BugsnagJavascriptSpansPlugin

static BugsnagJavascriptSpansPlugin *_sharedInstance = nil;

int nextCallbackId = 0;

NSMutableDictionary *spanUpdateCallbacks;

+ (id)singleton {
    return _sharedInstance;
}

- (void)installWithContext:(BugsnagPerformancePluginContext *)context {
    _sharedInstance = self;
    spanUpdateCallbacks = [NSMutableDictionary new];
    BugsnagJavascriptSpanControlProvider *spanControlProvider = [BugsnagJavascriptSpanControlProvider new];
    [context addSpanControlProvider:spanControlProvider];
}

- (void)start {
}

- (void)setEventEmitter:(RCTEventEmitter *)eventEmitter {
    _eventEmitter = eventEmitter;
}

- (int)registerSpanUpdateCallback:(OnSpanUpdatedCallback)callback {
    @synchronized (spanUpdateCallbacks) {
        int callbackId = nextCallbackId++;
        spanUpdateCallbacks[@(callbackId)] = callback;
        return callbackId;
    }
}

- (void)sendSpanUpdateEvent:(NSDictionary *)event {
    @synchronized (self) {
      if (_eventEmitter) {
          [_eventEmitter sendEventWithName:@"bugsnag:spanUpdate" body:event];
      }
    }
}

- (void)onRemoteSpanUpdated:(int)eventId withResult:(BOOL)result {
    OnSpanUpdatedCallback callback = [self takeSpanUpdateCallback:eventId];
    if (callback) {
        callback(result);
    }
}

- (OnSpanUpdatedCallback)takeSpanUpdateCallback:(int)eventId {
    @synchronized (spanUpdateCallbacks) {
        OnSpanUpdatedCallback callback = [spanUpdateCallbacks objectForKey:@(eventId)];
        if (!callback) {
            return nil;
        }

        [spanUpdateCallbacks removeObjectForKey:@(eventId)];
        return callback;
    }
}

@end
