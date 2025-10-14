// Copied from BugsnagPerformanceConfiguration.h in bugsnag-cocoa-performance
#import "BugsnagPerformanceSpan.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^ BugsnagPerformanceSpanStartCallback)(BugsnagPerformanceSpan *span);

typedef BOOL (^ BugsnagPerformanceSpanEndCallback)(BugsnagPerformanceSpan *span);

@interface BugsnagPerformanceConfiguration : NSObject

@property (nonatomic) NSString *apiKey;

@property (nonatomic) NSURL *_Nullable endpoint;

@property (copy, nullable, nonatomic) NSString *appVersion;

@property (copy, nullable, nonatomic) NSString *bundleVersion;

@property (copy, nullable, nonatomic) NSString *serviceName;

@property (nonatomic, nullable) NSNumber *samplingProbability;

@property (nonatomic) NSUInteger attributeStringValueLimit;

@property (nonatomic) NSUInteger attributeArrayLengthLimit;

@property (nonatomic) NSUInteger attributeCountLimit;

@property (copy, nonatomic) NSString *releaseStage;

@property (copy, nullable, nonatomic) NSSet<NSString *> *enabledReleaseStages;

@end

NS_ASSUME_NONNULL_END
