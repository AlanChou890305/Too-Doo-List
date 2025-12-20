//
//  WidgetReloader.m
//  ToDo
//
//  Bridge file for WidgetReloader module
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetReloader, NSObject)

RCT_EXTERN_METHOD(reloadAllWidgets)
RCT_EXTERN_METHOD(reloadWidgetWithData:(NSString *)json)

@end
