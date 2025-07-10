#import "BugsnagJavascriptSpanQuery.h"
#import "BugsnagJavascriptSpanControl.h"

static NSString * const spanNameAttributeKey = @"name";

@implementation BugsnagJavascriptSpanQuery

+ (instancetype)queryWithName:(NSString *)spanName {
  NSDictionary *attributes = @{spanNameAttributeKey: spanName};
  return [self queryWithResultType:[BugsnagJavascriptSpanControl class] attributes:attributes];
}

@end
