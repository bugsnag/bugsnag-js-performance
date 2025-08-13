#import "BugsnagJavascriptSpanControl.h"
#import "BugsnagJavascriptSpanControl+Private.h"
#import "BugsnagJavascriptSpanControlProvider.h"

@implementation BugsnagJavascriptSpanControlProvider

- (id<BugsnagPerformanceSpanControl>)getSpanControlsWithQuery:(BugsnagPerformanceSpanQuery *)query {
  if (query.resultType == [BugsnagJavascriptSpanControl class]) {
    NSString *spanName = [query getAttributeWithName:@"name"];
    if (spanName != nil) {
      return [[BugsnagJavascriptSpanControl alloc] initWithSpanName: spanName];
    }
  }
  
  return nil;
}

@end
