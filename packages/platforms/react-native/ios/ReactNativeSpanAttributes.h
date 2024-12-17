#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ReactNativeSpanAttributes : NSObject

+ (void)setNativeAttributes:(NSMutableDictionary *)attributes fromJSAttributes:(NSDictionary *)jsAttributes;

@end

NS_ASSUME_NONNULL_END
