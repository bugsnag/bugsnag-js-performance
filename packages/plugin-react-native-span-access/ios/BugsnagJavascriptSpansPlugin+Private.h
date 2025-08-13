#import "BugsnagJavascriptSpansPlugin.h"
#import "BugsnagJavascriptSpanControl.h"
#import <React/RCTEventEmitter.h>


@interface BugsnagJavascriptSpansPlugin ()

+ (id)singleton;

- (void)setEventEmitter:(RCTEventEmitter *)eventEmitter;

- (int)registerSpanUpdateCallback:(OnSpanUpdatedCallback)callback;

- (void)sendSpanUpdateEvent:(NSDictionary *)event;

- (void)onRemoteSpanUpdated:(int)eventId withResult:(BOOL)result;

- (int)registerSpanContextCallback:(RemoteSpanContextCallback)callback;

- (void)sendSpanContextEvent:(NSDictionary *)event;

- (void)onRemoteSpanContextReceived:(int)eventId withContext:(NSString *)context;

@end
