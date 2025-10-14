#import "BSGViewController.h"

@implementation BSGViewController

- (void)loadView {
    if (self.viewFactory) {
        self.view = self.viewFactory();
    } else {
        [super loadView];
    }
}

@end