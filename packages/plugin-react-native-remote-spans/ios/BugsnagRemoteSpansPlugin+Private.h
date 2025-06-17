#import "BugsnagRemoteSpansPlugin.h"

@interface BugsnagRemoteSpansPlugin ()

+ (id)singleton;

@property(nonatomic, readonly) NSMutableDictionary *spansByName;
@property(nonatomic, readonly) NSMutableDictionary *spansById;

@end
