//
//  ConfigFileReader.m
//  reactnative
//
//  Created by Alex Moinet on 04/05/2023.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ConfigFileReader.h"

@interface FixtureConfig : NSObject

@property (nonatomic, strong) NSString *maze_address;

@end

@implementation FixtureConfig

@end

@implementation ConfigFileReader

- (NSString *)loadMazeRunnerAddress {
    NSString *bsAddress = @"http://bs-local.com:9339";
    
    // Only iOS 12 and above will run on BitBar for now
    if (@available(iOS 12.0, *)) {
        // Continue execution
    } else {
        return bsAddress;
    }
    
    for (int i = 0; i < 60; i++) {
        NSURL *documentsUrl = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject];
        
        NSLog(@"Reading Maze Runner address from fixture_config.json");
        @try {
            NSURL *fileUrl = [[NSURL fileURLWithPath:@"fixture_config" relativeToURL:documentsUrl] URLByAppendingPathExtension:@"json"];
            NSData *savedData = [NSData dataWithContentsOfURL:fileUrl];
            if (savedData) {
                NSString *contents = [[NSString alloc] initWithData:savedData encoding:NSUTF8StringEncoding];
                if (contents) {
                    NSError *error;
                    NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:[contents dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
                    if (!error) {
                        FixtureConfig *config = [[FixtureConfig alloc] init];
                        config.maze_address = jsonDict[@"maze_address"];
                        NSString *address = [NSString stringWithFormat:@"http://%@", config.maze_address];
                        NSLog(@"Using Maze Runner address: %@", address);
                        return address;
                    }
                }
            }
        } @catch (NSException *exception) {
            NSLog(@"Failed to read fixture_config.json: %@", exception.reason);
        }
        NSLog(@"Waiting for fixture_config.json to appear");
        [NSThread sleepForTimeInterval:1.0];
    }
    
    NSLog(@"Unable to read from fixture_config.json, defaulting to BrowserStack environment");
    return bsAddress;
}

@end