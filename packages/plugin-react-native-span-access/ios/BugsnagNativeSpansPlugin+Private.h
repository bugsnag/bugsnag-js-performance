#import "BugsnagNativeSpansPlugin.h"

@interface BugsnagNativeSpansPlugin ()

+ (id)singleton;

@property(nonatomic, readonly) NSMutableDictionary *spansByName;
@property(nonatomic, readonly) NSMutableDictionary *spansById;

@end
