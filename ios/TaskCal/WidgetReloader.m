#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetReloader, NSObject)

RCT_EXTERN_METHOD(reloadWidgetWithData:(NSString *)json)
RCT_EXTERN_METHOD(reloadAllWidgets)

@end
