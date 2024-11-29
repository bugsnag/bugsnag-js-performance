#import "BugsnagPerformanceSpanContext.h"

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(uint8_t, BSGFirstClass) {
    BSGFirstClassNo = 0,
    BSGFirstClassYes = 1,
    BSGFirstClassUnset = 2,
};

// Affects whether or not a span should include rendering metrics
typedef NS_ENUM(uint8_t, BSGInstrumentRendering) {
    BSGInstrumentRenderingNo = 0, // Never include rendering metrics
    BSGInstrumentRenderingYes = 1, // Always include rendering metrics, as long as the autoInstrumentRendering configuration option is on
    BSGInstrumentRenderingUnset = 2, // Include rendering metrics only if the span is first class, start and end times were not set when creating/closing the span and the autoInstrumentRendering configuration option is on
};

@interface BugsnagPerformanceSpanOptions : NSObject

@property(nonatomic) NSDate * _Nullable startTime;
@property(nonatomic) BugsnagPerformanceSpanContext * _Nullable parentContext;
@property(nonatomic) BOOL makeCurrentContext;
@property(nonatomic) BSGFirstClass firstClass;
@property(nonatomic) BSGInstrumentRendering instrumentRendering;

@end
NS_ASSUME_NONNULL_END