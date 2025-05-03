// WeeklyTasksWidget.js temporarily disabled for SDK 52 compatibility
// import { registerWidget } from 'expo-widget';
// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// registerWidget(
//   'WeeklyTasksWidget',
//   ({ weekTasks }) => (
//     <View style={styles.widgetContainer}>
//       <Text style={styles.header}>This Week's Tasks</Text>
//       <View style={styles.weekRow}>
//         {weekTasks.map(({ date, tasks }) => (
//           <View style={styles.dayCol} key={date}>
//             <Text style={styles.dayLabel}>{date.slice(5)}</Text>
//             {tasks.length === 0 ? (
//               <Text style={styles.noTask}>-</Text>
//             ) : (
//               tasks.slice(0, 2).map(t => (
//                 <Text style={styles.task} key={t.id}>{t.text.length > 10 ? t.text.slice(0, 10) + '…' : t.text}</Text>
//               ))
//             )}
//             {tasks.length > 2 && <Text style={styles.moreTask}>+{tasks.length - 2}</Text>}
//           </View>
//         ))}
//       </View>
//     </View>
//   )
// );

// const styles = StyleSheet.create({
//   widgetContainer: { backgroundColor: '#fff', padding: 10, borderRadius: 12, borderColor: '#eee', borderWidth: 1 },
//   header: { fontWeight: '700', fontSize: 14, color: '#6c63ff', marginBottom: 6 },
//   weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
//   dayCol: { alignItems: 'center', flex: 1, marginHorizontal: 2 },
//   dayLabel: { fontSize: 12, color: '#3d3d4e', marginBottom: 2 },
//   noTask: { color: '#bbb', fontSize: 10 },
//   task: { fontSize: 11, color: '#3d3d4e', backgroundColor: '#f7f7fa', borderRadius: 6, paddingHorizontal: 4, marginVertical: 1 },
//   moreTask: { color: '#6c63ff', fontSize: 10, marginTop: 1 },
// });
