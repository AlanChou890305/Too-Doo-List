import WidgetKit
import SwiftUI

private let appGroupId = "group.com.cty0305.too.doo.list.data"
private let widgetDataKey = "widgetTasksByDate"

struct TaskCalWidgetEntry: TimelineEntry {
  let date: Date
  let tasks: [WidgetTask]
}

struct WidgetTask: Codable {
  let id: String
  let title: String
  let time: String
  let completed: Bool
}

struct TaskCalWidget: Widget {
  let kind: String = "TaskCalWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: TaskCalWidgetProvider()) { entry in
      TaskCalWidgetView(entry: entry)
    }
    .configurationDisplayName("Today's Tasks")
    .description("View your today's to-do list on the home screen.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct TaskCalWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> TaskCalWidgetEntry {
    TaskCalWidgetEntry(date: Date(), tasks: [])
  }

  func getSnapshot(in context: Context, completion: @escaping (TaskCalWidgetEntry) -> Void) {
    let entry = TaskCalWidgetEntry(date: Date(), tasks: loadTodayTasks())
    completion(entry)
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TaskCalWidgetEntry>) -> Void) {
    let tasks = loadTodayTasks()
    let entry = TaskCalWidgetEntry(date: Date(), tasks: tasks)
    let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    completion(timeline)
  }

  private func loadTodayTasks() -> [WidgetTask] {
    guard let store = UserDefaults(suiteName: appGroupId),
          let json = store.string(forKey: widgetDataKey),
          let data = json.data(using: .utf8) else { return [] }
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    let todayKey = formatter.string(from: Date())
    guard let dict = try? JSONDecoder().decode([String: [WidgetTask]].self, from: data),
          let dayTasks = dict[todayKey] else { return [] }
    return dayTasks
  }
}

struct TaskCalWidgetView: View {
  @Environment(\.widgetFamily) var family
  var entry: TaskCalWidgetEntry

  var body: some View {
    let (pending, completed) = entry.tasks.splitByCompleted()
    VStack(alignment: .leading, spacing: 6) {
      Text("Today")
        .font(.headline)
        .foregroundColor(.primary)
      if entry.tasks.isEmpty {
        Text("No tasks")
          .font(.subheadline)
          .foregroundColor(.secondary)
      } else {
        ForEach(Array(pending.prefix(family == .systemSmall ? 3 : 6)), id: \.id) { task in
          HStack(alignment: .center, spacing: 6) {
            Image(systemName: "circle")
              .font(.caption)
              .foregroundColor(.secondary)
            VStack(alignment: .leading, spacing: 0) {
              Text(task.title)
                .font(.subheadline)
                .lineLimit(1)
              if !task.time.isEmpty {
                Text(task.time)
                  .font(.caption2)
                  .foregroundColor(.secondary)
              }
            }
            Spacer(minLength: 0)
          }
        }
        if family == .systemMedium && !completed.isEmpty {
          Text("\(completed.count) done")
            .font(.caption2)
            .foregroundColor(.secondary)
        }
      }
    }
    .padding()
  }
}

extension Array where Element == WidgetTask {
  func splitByCompleted() -> (pending: [WidgetTask], completed: [WidgetTask]) {
    let p = filter { !$0.completed }
    let c = filter { $0.completed }
    return (p, c)
  }
}

struct TaskCalWidget_Previews: PreviewProvider {
  static var previews: some View {
    TaskCalWidgetView(entry: TaskCalWidgetEntry(date: Date(), tasks: [
      WidgetTask(id: "1", title: "Buy groceries", time: "09:00", completed: false),
      WidgetTask(id: "2", title: "Call mom", time: "14:00", completed: false),
    ]))
    .previewContext(WidgetPreviewContext(family: .systemSmall))
  }
}
