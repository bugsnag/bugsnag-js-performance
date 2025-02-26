#import "ReactNativeSpanAttributes.h"

@implementation ReactNativeSpanAttributes

+ (void)setNativeAttributes:(NSMutableDictionary *)attributes fromJSAttributes:(NSDictionary *)jsAttributes {
    for (NSString *key in jsAttributes) {
        id value = jsAttributes[key];
        if ([value isKindOfClass:[NSNumber class]]) {
            [self setNSNumberAttribute:attributes key:key value:value];
        } else if ([value isKindOfClass:[NSArray class]]) {
            [self setArrayAttribute:attributes key:key value:value];
        } else {
            attributes[key] = value;
        }
    }
}

+ (void)setNSNumberAttribute:(NSMutableDictionary *)attributes key:(NSString *)key value:(NSNumber *)value {
    if ([self isBoolean:value]) {
        attributes[key] = value;
        return;
    }
    
    double doubleValue = [value doubleValue];
    long longValue = (long)doubleValue;
    if (doubleValue == longValue) {
        attributes[key] = @(longValue);
    } else {
        attributes[key] = @(doubleValue);
    }
}

+ (void)setArrayAttribute:(NSMutableDictionary *)attributes key:(NSString *)key value:(NSArray *)value {
    NSUInteger size = value.count;
    if (size == 0) {
        attributes[key] = @[];
        return;
    }
    
    if ([self isNumberArray:value]) {
        [self setNumberArrayAttribute:attributes key:key value:value];
    } else {
        attributes[key] = value;
    }
}

+ (void)setNumberArrayAttribute:(NSMutableDictionary *)attributes key:(NSString *)key value:(NSArray *)value {
    NSUInteger size = value.count;
    if (size == 0) {
        attributes[key] = @[];
        return;
    }
    
    BOOL allIntegers = YES;
    NSMutableArray *longValues = [NSMutableArray arrayWithCapacity:size];
    for (NSNumber *number in value) {
        double doubleValue = [number doubleValue];
        long longValue = (long)doubleValue;
        if (doubleValue != longValue) {
            allIntegers = NO;
            break;
        }
        
        [longValues addObject:@(longValue)];
    }

    if (allIntegers) {
        attributes[key] = longValues;
    } else {
        NSMutableArray *doubleValues = [NSMutableArray arrayWithCapacity:size];
        for (NSNumber *number in value) {
            [doubleValues addObject:@([number doubleValue])];
        }
        attributes[key] = doubleValues;
    }
}

+ (BOOL)isNumberArray:(NSArray *)array {
    id firstValue = array[0];
    if ([firstValue isKindOfClass:[NSNumber class]]) {
        return ![self isBoolean:firstValue];
    }
    
    return NO;
}

+ (BOOL) isBoolean:(NSNumber *)value {
    return CFGetTypeID((__bridge CFTypeRef)(value)) == CFBooleanGetTypeID();
}

@end
