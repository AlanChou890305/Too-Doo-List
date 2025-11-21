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
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
