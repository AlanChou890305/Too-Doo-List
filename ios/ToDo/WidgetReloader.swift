//
//  WidgetReloader.swift
//  ToDo
//
//  Created to reload iOS widgets when data changes
//

import Foundation
import WidgetKit

@objc(WidgetReloader)
class WidgetReloader: NSObject {
  
  @objc
  func reloadAllWidgets() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      print("✅ [WidgetReloader] Reloaded all widget timelines")
    }
  }

  @objc
  func reloadWidgetWithData(_ json: String) {
      let suiteName = "group.com.cty0305.too.doo.list.data"
      if let sharedDefaults = UserDefaults(suiteName: suiteName) {
          sharedDefaults.set(json, forKey: "todayTasks")
          sharedDefaults.synchronize() // Force write to disk
          print("✅ [WidgetReloader] Saved data to App Group")
          
          if #available(iOS 14.0, *) {
              WidgetCenter.shared.reloadAllTimelines()
              print("✅ [WidgetReloader] Reloaded all widget timelines")
          }
      } else {
          print("❌ [WidgetReloader] Failed to access App Group: \(suiteName)")
      }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
