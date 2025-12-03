import WidgetKit
import SwiftUI
import Intents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), tasks: [], debugInfo: "Placeholder")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let (tasksMap, debug) = fetchTasksMap()
        let todayKey = formatDate(Date())
        let tasks = tasksMap[todayKey] ?? []
        let entry = SimpleEntry(date: Date(), tasks: tasks, debugInfo: debug)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let (tasksMap, debug) = fetchTasksMap()
        var entries: [SimpleEntry] = []
        
        // Generate timeline for Today + Next 7 days
        let currentDate = Date()
        let calendar = Calendar.current
        
        for i in 0..<8 {
            if let date = calendar.date(byAdding: .day, value: i, to: currentDate) {
                // For the first entry (today), use current time.
                // For future entries, use midnight (start of day).
                let entryDate = (i == 0) ? currentDate : calendar.startOfDay(for: date)
                
                let dateKey = formatDate(date)
                let tasks = tasksMap[dateKey] ?? []
                
                let entry = SimpleEntry(date: entryDate, tasks: tasks, debugInfo: debug)
                entries.append(entry)
            }
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private func fetchTasksMap() -> ([String: [WidgetTask]], String) {
        let suiteName = "group.com.cty0305.too.doo.list.data"
        guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
            print("❌ [Widget] No Suite: \(suiteName)")
            return ([:], "No Suite: \(suiteName)")
        }
        
        guard let dataString = sharedDefaults.string(forKey: "widgetTasksByDate") else {
            print("❌ [Widget] No Data for key: widgetTasksByDate")
            // Debug: Check what keys exist
            if let allKeys = sharedDefaults.dictionaryRepresentation().keys as? [String] {
                print("📱 [Widget] Available keys: \(allKeys.filter { $0.contains("widget") })")
            }
            return ([:], "No Data for key: widgetTasksByDate")
        }
        
        print("📱 [Widget] Found data string, length: \(dataString.count)")
        
        guard let data = dataString.data(using: .utf8) else {
            print("❌ [Widget] Data encoding error")
            return ([:], "Data encoding error")
        }
        
        do {
            let tasksMap = try JSONDecoder().decode([String: [WidgetTask]].self, from: data)
            print("📱 [Widget] Decoded map with \(tasksMap.keys.count) days")
            
            // Debug: Log today's tasks
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            let todayKey = formatter.string(from: Date())
            if let todayTasks = tasksMap[todayKey] {
                print("📱 [Widget] Today (\(todayKey)) has \(todayTasks.count) tasks")
                for task in todayTasks {
                    print("  - \(task.title) (completed: \(task.completed))")
                }
            } else {
                print("⚠️ [Widget] No tasks found for today (\(todayKey))")
                print("📱 [Widget] Available dates: \(tasksMap.keys.sorted())")
            }
            
            return (tasksMap, "Success (\(tasksMap.keys.count) days)")
        } catch {
            print("❌ [Widget] Decode Error: \(error.localizedDescription)")
            print("❌ [Widget] Error details: \(error)")
            return ([:], "Decode Error: \(error.localizedDescription)")
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
            } else {
                // Filter to show only uncompleted tasks in widget
                let uncompletedTasks = entry.tasks.filter { !$0.completed }
                if uncompletedTasks.isEmpty {
                    Text("All tasks completed!")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    ForEach(uncompletedTasks.prefix(4)) { task in
                        HStack(spacing: 6) {
                            Image(systemName: "square")
                                .foregroundColor(.gray)
                                .font(.system(size: 14))
                            
                            Text(task.title)
                                .font(.caption)
                                .lineLimit(1)
                            
                            Spacer()
                            
                            if !task.time.isEmpty {
                                Text(formatTime(task.time))
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(Color(red: 0.58, green: 0.40, blue: 0.93)) // Purple brand color #9466EE
                            }
                        }
                    }
                    if uncompletedTasks.count > 4 {
                        Text("+ \(uncompletedTasks.count - 4) more")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
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
