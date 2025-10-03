#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface BSGViewController : UIViewController

@property (nonatomic, copy, nullable) UIView *(^viewFactory)();

@end

NS_ASSUME_NONNULL_END