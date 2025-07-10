#import "BugsnagJavascriptSpansPlugin+Private.h"
#import "BugsnagJavascriptSpanControlProvider.h"
#import <BugsnagPerformance/BugsnagPerformanceSpan.h>
#import <BugsnagPerformance/BugsnagPerformancePluginContext.h>

@interface BugsnagJavascriptSpansPlugin ()

@property (nonatomic, weak) RCTEventEmitter *eventEmitter;

@end

@implementation BugsnagJavascriptSpansPlugin

static BugsnagJavascriptSpansPlugin *_sharedInstance = nil;

+ (id)singleton {
    return _sharedInstance;
}

- (void)installWithContext:(BugsnagPerformancePluginContext *)context {
  _sharedInstance = self;
  BugsnagJavascriptSpanControlProvider *spanControlProvider = [BugsnagJavascriptSpanControlProvider new];
  [context addSpanControlProvider:spanControlProvider];
}

- (void)start {
}

- (void)setEventEmitter:(RCTEventEmitter *)eventEmitter {
    _eventEmitter = eventEmitter;
}

- (void)sendSpanUpdateEvent:(NSDictionary *)event {
    if (_eventEmitter) {
        [_eventEmitter sendEventWithName:@"bugsnag:spanUpdate" body:event];
    }
}

@end
