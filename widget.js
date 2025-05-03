// widget.js temporarily disabled for SDK 52 compatibility
// import { registerWidgetTask } from 'expo-widget';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const TASKS_STORAGE_KEY = 'TASKS_STORAGE_KEY';

// function getWeekDates() {
//   const today = new Date();
//   const dayOfWeek = today.getDay();
//   const sunday = new Date(today);
//   sunday.setDate(today.getDate() - dayOfWeek);
//   let week = [];
//   for (let i = 0; i < 7; i++) {
//     const d = new Date(sunday);
//     d.setDate(sunday.getDate() + i);
//     week.push(d.toISOString().split('T')[0]);
//   }
//   return week;
// }

// registerWidgetTask(async () => {
//   const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
//   const tasks = data ? JSON.parse(data) : {};
//   const weekDates = getWeekDates();
//   const weekTasks = weekDates.map(date => ({
//     date,
//     tasks: tasks[date] || [],
//   }));
//   return {
//     weekTasks,
//   };
// });
