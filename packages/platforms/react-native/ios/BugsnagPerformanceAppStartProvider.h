#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Protocol for providing app start span context and handling app start completion.
 * This allows the optional plugin-react-native-span-access package to register itself
 * without creating a circular dependency or linker error.
 */
@protocol BugsnagPerformanceAppStartProvider <NSObject>

/**
 * Returns the app start parent context as a trace parent string, or nil if not available.
 */
- (NSString * _Nullable)getAppStartParent;

/**
 * Ends the app start span at the specified time.
 * @param endTime the end time
 */
- (void)endAppStart:(NSDate *)endTime;

@end

NS_ASSUME_NONNULL_END
