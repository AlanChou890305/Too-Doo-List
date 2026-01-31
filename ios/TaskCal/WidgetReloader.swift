import Foundation
import WidgetKit

private let appGroupId = "group.com.cty0305.too.doo.list.data"
private let widgetDataKey = "widgetTasksByDate"

@objc(WidgetReloader)
class WidgetReloader: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func reloadWidgetWithData(_ json: String) {
    guard let store = UserDefaults(suiteName: appGroupId) else { return }
    store.set(json, forKey: widgetDataKey)
    store.synchronize()
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc
  func reloadAllWidgets() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
