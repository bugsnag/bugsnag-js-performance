#import "BugsnagJavascriptSpansPlugin.h"
#import <React/RCTEventEmitter.h>


@interface BugsnagJavascriptSpansPlugin ()

+ (id)singleton;

- (void)setEventEmitter:(RCTEventEmitter *)eventEmitter;

- (void)sendSpanUpdateEvent:(NSDictionary *)event;

@end
