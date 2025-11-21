import WidgetKit
import SwiftUI

// @main // Removed @main from here because ToDoWidget.swift has it
struct ToDoWidgetBundle: WidgetBundle {
    var body: some Widget {
        ToDoWidget()
    }
}
