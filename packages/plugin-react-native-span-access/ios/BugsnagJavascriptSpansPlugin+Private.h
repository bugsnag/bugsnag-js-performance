#import "BugsnagJavascriptSpansPlugin.h"
#import "BugsnagJavascriptSpanControl.h"
#import <React/RCTEventEmitter.h>


@interface BugsnagJavascriptSpansPlugin ()

+ (id)singleton;

- (void)setEventEmitter:(RCTEventEmitter *)eventEmitter;

- (int)registerSpanUpdateCallback:(OnSpanUpdatedCallback)callback;

- (void)sendSpanUpdateEvent:(NSDictionary *)event;

- (void)onRemoteSpanUpdated:(int)eventId withResult:(BOOL)result;
@end
