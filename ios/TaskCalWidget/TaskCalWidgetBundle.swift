import WidgetKit
import SwiftUI

// @main // Removed @main from here because TaskCalWidget.swift has it
struct TaskCalWidgetBundle: WidgetBundle {
    var body: some Widget {
        TaskCalWidget()
    }
}
