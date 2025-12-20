import WidgetKit
import SwiftUI
import Intents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), tasks: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), tasks: fetchTasks())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let tasks = fetchTasks()
        let entry = SimpleEntry(date: Date(), tasks: tasks)

        // Refresh every 15 minutes or when app updates
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
    
    private func fetchTasks() -> [WidgetTask] {
        let sharedDefaults = UserDefaults(suiteName: "group.com.cty0305.too.doo.list.data")
        if let data = sharedDefaults?.string(forKey: "widgetData")?.data(using: .utf8) {
            do {
                let decoder = JSONDecoder()
                let widgetData = try decoder.decode(WidgetData.self, from: data)
                return widgetData.tasks
            } catch {
                print("Error decoding widget data: \(error)")
            }
        }
        return []
    }
}

struct WidgetTask: Codable, Identifiable {
    let id: String
    let title: String
    let completed: Bool
}

struct WidgetData: Codable {
    let tasks: [WidgetTask]
    let lastUpdated: String
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let tasks: [WidgetTask]
}

struct ToDoWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Today's Tasks")
                .font(.headline)
                .foregroundColor(Color("WidgetTitleColor")) // Define this color in Assets or use system color
                .padding(.bottom, 4)
            
            if entry.tasks.isEmpty {
                Text("No tasks for today!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(entry.tasks.prefix(4)) { task in
                    HStack {
                        Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(task.completed ? .green : .gray)
                        Text(task.title)
                            .font(.subheadline)
                            .strikethrough(task.completed)
                            .lineLimit(1)
                    }
                }
                if entry.tasks.count > 4 {
                    Text("+ \(entry.tasks.count - 4) more")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
        }
        .padding()
    }
}

@main
struct ToDoWidget: Widget {
    let kind: String = "ToDoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ToDoWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("My ToDo List")
        .description("View your daily tasks at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct ToDoWidget_Previews: PreviewProvider {
    static var previews: some View {
        ToDoWidgetEntryView(entry: SimpleEntry(date: Date(), tasks: [
            WidgetTask(id: "1", title: "Buy Milk", completed: false),
            WidgetTask(id: "2", title: "Walk Dog", completed: true),
            WidgetTask(id: "3", title: "Code Widget", completed: false)
        ]))
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
