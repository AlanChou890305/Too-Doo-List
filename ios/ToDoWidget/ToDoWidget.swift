import WidgetKit
import SwiftUI
import Intents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), tasks: [], debugInfo: "Placeholder")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let (tasks, debug) = fetchTasks()
        let entry = SimpleEntry(date: Date(), tasks: tasks, debugInfo: debug)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let (tasks, debug) = fetchTasks()
        let entries = [SimpleEntry(date: Date(), tasks: tasks, debugInfo: debug)]
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
    
    private func fetchTasks() -> ([WidgetTask], String) {
        let suiteName = "group.com.cty0305.too.doo.list.data"
        guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
            return ([], "No Suite: \(suiteName)")
        }
        
        guard let dataString = sharedDefaults.string(forKey: "todayTasks") else {
             return ([], "No Data for key: todayTasks")
        }
        
        print("📱 [Widget] Raw data: \(dataString)")
        
        guard let data = dataString.data(using: .utf8) else {
            return ([], "Data encoding error")
        }
        
        do {
            let tasks = try JSONDecoder().decode([WidgetTask].self, from: data)
            print("📱 [Widget] Decoded \(tasks.count) tasks")
            for task in tasks {
                print("📱 [Widget] Task: \(task.title), Time: '\(task.time)'")
            }
            return (tasks, "Success (\(tasks.count))")
        } catch {
            return ([], "Decode Error: \(error.localizedDescription)")
        }
    }
}

struct WidgetTask: Codable, Identifiable {
    let id: String
    let title: String
    let time: String
    let completed: Bool
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let tasks: [WidgetTask]
    let debugInfo: String
}

struct ToDoWidgetEntryView : View {
    var entry: Provider.Entry
    
    // Format time to HH:MM (remove seconds if present)
    func formatTime(_ time: String) -> String {
        if time.isEmpty {
            return ""
        }
        // If time has seconds (HH:MM:SS), remove them
        let components = time.split(separator: ":")
        if components.count >= 2 {
            return "\(components[0]):\(components[1])"
        }
        return time
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Today's Tasks")
                .font(.headline)
                .padding(.bottom, 2)
            
            if entry.tasks.isEmpty {
                Text("No tasks for today!")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                // Debug info
                Text("Debug: \(entry.debugInfo)")
                    .font(.system(size: 8))
                    .foregroundColor(.red)
            } else {
                ForEach(entry.tasks.prefix(4)) { task in
                    HStack(spacing: 6) {
                        Image(systemName: task.completed ? "checkmark.square.fill" : "square")
                            .foregroundColor(task.completed ? Color(red: 0.58, green: 0.40, blue: 0.93) : .gray)
                            .font(.system(size: 14))
                        
                        Text(task.title)
                            .font(.caption)
                            .strikethrough(task.completed)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        if !task.time.isEmpty {
                            Text(formatTime(task.time))
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(Color(red: 0.58, green: 0.40, blue: 0.93)) // Purple brand color #9466EE
                        }
                    }
                }
                if entry.tasks.count > 4 {
                    Text("+ \(entry.tasks.count - 4) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(2)
    }
}

@main
struct ToDoWidget: Widget {
    let kind: String = "ToDoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                ToDoWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                ToDoWidgetEntryView(entry: entry)
                    .padding()
                    .background(Color(UIColor.systemBackground))
            }
        }
        .configurationDisplayName("Daily Tasks")
        .description("View your tasks for today.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
