import React, { useState, useEffect, useRef, useCallback } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  ScrollView,
  PanResponder,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";
// import { MaterialIcons } from '@expo/vector-icons'; // Already imported above
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

const TASKS_STORAGE_KEY = "TASKS_STORAGE_KEY";


function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Tab = createBottomTabNavigator();

function SettingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name="settings" size={64} color="#888" />
        <Text style={{ fontSize: 20, color: '#333', marginTop: 16 }}>Settings</Text>
        <Text style={{ color: '#888', marginTop: 8 }}>Coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}


function CalendarScreen({ navigation, route }) {
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [tasks, setTasks] = useState({});
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [modalVisible, setModalVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(new Date(getCurrentDate()).getMonth());
  const [visibleYear, setVisibleYear] = useState(new Date(getCurrentDate()).getFullYear());
  const [taskText, setTaskText] = useState("");
  const scrollViewRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(TASKS_STORAGE_KEY).then((data) => {
      if (data) {
        const loadedTasks = JSON.parse(data);
        setTasks(loadedTasks);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const today = getToday();
    setSelectedDate(today);
    const timer = setTimeout(centerToday, 500);
    return () => clearTimeout(timer);
  }, []);

  const centerToday = () => {
    if (!scrollViewRef.current) return;
    const todayDate = new Date(getToday());
    todayDate.setHours(12, 0, 0, 0);
    const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);
    const diffInDays = Math.floor((todayDate - firstSunday) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffInDays / 7);
    const weekHeight = 50;
    const visibleWeeks = 4;
    const scrollPosition = (weekNumber * weekHeight) - ((visibleWeeks / 2) * weekHeight);
    scrollViewRef.current.scrollTo({
      y: scrollPosition,
      animated: true
    });
  };

  const openAddTask = (date) => {
    setEditingTask(null);
    setTaskText("");
    setSelectedDate(date);
    setModalVisible(true);
  };

  const openEditTask = (task) => {
    console.log('Open edit task:', task);
    setEditingTask(task);
    setTaskText(task.text);
    setSelectedDate(task.date);
    setModalVisible(true);
  };

  const saveTask = () => {
    if (taskText.trim() === "") return;
    let dayTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
    if (editingTask) {
      dayTasks = dayTasks.map((t) =>
        t.id === editingTask.id
          ? { ...t, text: taskText, date: selectedDate }
          : t
      );
    } else {
      dayTasks.push({
        id: Date.now().toString(),
        text: taskText,
        date: selectedDate,
      });
    }
    setTasks({ ...tasks, [selectedDate]: dayTasks });
    setModalVisible(false);
    setEditingTask(null);
    setTaskText("");
  };

  const deleteTask = (task) => {
    if (!task) return;
    const day = task.date;
    const dayTasks = tasks[day] ? [...tasks[day]] : [];
    const filteredTasks = dayTasks.filter((t) => t.id !== task.id);
    const newTasks = { ...tasks, [day]: filteredTasks };
    setTasks(newTasks);
    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
    setModalVisible(false);
    setEditingTask(null);
    setTaskText("");
    console.log('Deleted task', task.id);
    console.log('Tasks after delete:', newTasks);
  };

  const startMoveTask = (task) => {
    setMoveMode(true);
    setTaskToMove(task);
    Alert.alert(
      "Move Task",
      "Now tap a date on the calendar to move this task."
    );
  };

  const moveTaskToDate = (task, toDate) => {
    if (task.date === toDate) return;
    if (task.date !== selectedDate) return;
    const fromTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
    const toTasks = tasks[toDate] ? [...tasks[toDate]] : [];
    const filteredTasks = fromTasks.filter((t) => t.id !== task.id);
    toTasks.push({ ...task });
    setTasks({ ...tasks, [selectedDate]: filteredTasks, [toDate]: toTasks });
    setMoveMode(false);
    setTaskToMove(null);
  };

  const renderCalendar = () => {
    const weeks = [];
    const currentDate = new Date(visibleYear, visibleMonth, 1);

    // Get the first day of the month and the last day of the month
    const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
    const lastDayOfMonth = new Date(visibleYear, visibleMonth + 1, 0);

    // Find the first Sunday on or before the first day of the month
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);

    // We want exactly 5 weeks (35 days)
    for (let week = 0; week < 5; week++) {
      const weekDates = [];

      // Generate all 7 days of the week
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(firstSunday);
        dayDate.setDate(firstSunday.getDate() + (week * 7) + day);
        dayDate.setHours(12, 0, 0, 0);

        const dateStr = dayDate.toISOString().split("T")[0];
        weekDates.push(renderDate(dateStr));
      }

      weeks.push(
        <View key={`week-${week}`} style={styles.calendarWeekRow}>
          {weekDates}
        </View>
      );
    }

    return (
      <PanGestureHandler onHandlerStateChange={handleVerticalGesture}>
        <View>
          {weeks}
        </View>
      </PanGestureHandler>
    );
  };

  const renderDate = (date) => {
    const isSelected = date === selectedDate;
    const dateObj = new Date(date);

    const isCurrentMonth =
      dateObj.getMonth() === visibleMonth &&
      dateObj.getFullYear() === visibleYear;

    // Format the current date to match the date string format (YYYY-MM-DD)
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = date === todayFormatted;
    const isInRange = true; // Always show the date number

    const renderDateContent = () => {
      return (
        <View style={styles.dateContainer}>
          <View style={[
            styles.dateTextContainer,
            isToday && styles.todayCircle,
            isSelected && styles.selectedDate
          ]}>
            <Text style={[
              styles.calendarDayText,
              !isCurrentMonth && styles.otherMonthText,
              isSelected && styles.selectedDayText,
              isToday && styles.todayText,
              !isInRange && styles.hiddenDate,
            ]}>
              {isInRange ? dateObj.getDate() : ''}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <TouchableOpacity
        key={date}
        onPress={() => {
          if (moveMode && taskToMove) {
            moveTaskToDate(taskToMove, date);
            setMoveMode(false);
            setTaskToMove(null);
          } else {
            setSelectedDate(date);
          }
        }}
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          moveMode && styles.calendarDayMoveTarget,
        ]}
      >
        {renderDateContent()}
        {(tasks[date]?.length > 0) && (
          <View style={styles.taskDot} />
        )}
      </TouchableOpacity>
    );
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => openEditTask(item)}
      onLongPress={() => startMoveTask(item)}
    >
      <Text style={styles.taskText}>{item.text}</Text>
      {moveMode && taskToMove && taskToMove.id === item.id && (
        <Text style={styles.moveHint}>Tap a date to move</Text>
      )}
    </TouchableOpacity>
  );

  // Helper to get previous/next day in YYYY-MM-DD
  const getAdjacentDate = (dateStr, diff) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + diff);
    return date.toISOString().split('T')[0];
  };

  // Handler for horizontal swipe in task area
  const handleTaskAreaGesture = ({ nativeEvent }) => {
    const { translationX, state } = nativeEvent;
    // Only trigger on gesture end (state === 5 for END)
    if (state === 5) {
      if (translationX < -1) {
        // Swipe left, go to next day
        setSelectedDate(getAdjacentDate(selectedDate, 1));
      } else if (translationX > 1) {
        // Swipe right, go to previous day
        setSelectedDate(getAdjacentDate(selectedDate, -1));
      }
    }
  };

  const renderTaskArea = () => {
    const dayTasks = tasks[selectedDate] || [];
    console.log('RenderTaskArea dayTasks:', dayTasks);
    return (
      <PanGestureHandler onHandlerStateChange={handleTaskAreaGesture} activeOffsetY={[-20, 20]} activeOffsetX={[-20, 20]}>
        <View style={styles.taskArea}>
          <View style={[styles.taskAreaContent, {
            flexGrow: 1,
            maxHeight: Dimensions.get('window').height * 0.38, // Adjust as needed for your layout
            overflow: 'hidden',
          }]}>
            <View style={styles.tasksHeaderRow}>
              <Text style={styles.tasksHeader}>{selectedDate}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openAddTask(selectedDate)}
                activeOpacity={0.7}
              >
                <View style={styles.addButtonIcon}>
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Line x1="12" y1="4" x2="12" y2="20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                    <Line x1="4" y1="12" x2="20" y2="12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>
            {dayTasks.length === 0 ? (
              <View style={styles.noTaskContainer}>
                <Svg width={64} height={64} viewBox="0 0 64 64" style={{ marginBottom: 12 }}>
                  <Rect x="10" y="20" width="44" height="32" rx="8" fill="#eee" />
                  <Line x1="18" y1="32" x2="46" y2="32" stroke="#bbb" strokeWidth="2" strokeLinecap="round" />
                  <Line x1="18" y1="40" x2="38" y2="40" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="32" cy="16" r="6" fill="#e0e0e0" />
                </Svg>
                <Text style={styles.noTaskText}>No tasks for this day.</Text>
              </View>
            ) : (
              <FlatList
                data={dayTasks}
                keyExtractor={item => item.id}
                renderItem={renderTask}
                contentContainerStyle={styles.tasksScrollContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </PanGestureHandler>
    );
  };


  const renderModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingTask ? "Edit task" : "Create task"}
          </Text>
          <TextInput
            style={styles.input}
            value={taskText}
            onChangeText={setTaskText}
            placeholder="任務描述"
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.saveButton, { marginRight: 4 }]}
              onPress={saveTask}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { marginRight: editingTask ? 4 : 0 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            {editingTask && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTask(editingTask)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Calendar navigation functions
  // Handles vertical swipe gestures for month navigation
  const handleVerticalGesture = ({ nativeEvent }) => {
    const { translationY, state } = nativeEvent;
    // Only trigger on gesture end (state === 5 for END in react-native-gesture-handler)
    if (state === 5) {
      if (translationY < -50) {
        goToNextMonth(); // Swipe up
      } else if (translationY > 50) {
        goToPrevMonth(); // Swipe down
      }
    }
  };

  const goToNextMonth = () => {
    let newMonth = visibleMonth + 1;
    let newYear = visibleYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setVisibleMonth(newMonth);
    setVisibleYear(newYear);
  };

  const goToPrevMonth = () => {
    let newMonth = visibleMonth - 1;
    let newYear = visibleYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setVisibleMonth(newMonth);
    setVisibleYear(newYear);
  };

  // Calendar header UI
  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ];
  const header = (
    <View style={styles.fixedHeader}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start" }}>
        <Text style={styles.currentMonthTitle}>
          {visibleYear} {monthNames[visibleMonth]}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <GestureHandlerRootView style={styles.container}>
      <View style={styles.calendarSection}>
        {header}
        <View style={styles.weekDaysHeader}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <Text key={i} style={styles.weekDayText}>{d}</Text>
          ))}
        </View>
        <View style={styles.calendarDivider} />
        <PanGestureHandler onHandlerStateChange={handleVerticalGesture}>
          <View>
            <ScrollView
              ref={scrollViewRef}
              style={styles.calendarScrollView}
              contentContainerStyle={styles.scrollContent}
            >
              {renderCalendar()}
            </ScrollView>
          </View>
        </PanGestureHandler>
      </View>
      <View style={styles.taskAreaContainer}>
        {renderTaskArea()}
      </View>
      {renderModal()}
    </GestureHandlerRootView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Calendar"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Calendar') {
              iconName = 'calendar-today';
            } else if (route.name === 'Setting') {
              iconName = 'settings';
            }
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name={iconName} size={size} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: '#111',
          tabBarInactiveTintColor: '#888',
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 60,
            paddingBottom: 4,
            paddingTop: 4,
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderTopWidth: 1,
            borderTopColor: '#eee',
          },
          tabBarIconStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
        })}
      >
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Setting" component={SettingScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // ...
  // Removed bottomMenuBar style, handled by Tab.Navigator now

  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  calendarSection: {
    flexShrink: 0,
    backgroundColor: '#fff',
  },
  taskAreaContainer: {
    backgroundColor: '#f4f4f6',
    width: '100%',
    flex: 1,
    paddingBottom: 60, // Add padding equal to bottom bar height
  },
  taskArea: {
    flex: 1,
    backgroundColor: '#f7f7fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  currentMonthTitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "left",
    marginBottom: 10,
    marginLeft: 16,
    marginTop: 10,
  },
  weekDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  // Scroll container
  calendarDivider: {
    height: 1,
    backgroundColor: '#bbbbbb',
    marginBottom: 4,
  },
  calendarScrollView: {
    flexGrow: 0,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 0,
  },
  scrollSpacer: {
    height: 10,
  },
  // Month container
  monthContainer: {
    marginBottom: 0,
  },
  customCalendar: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    backgroundColor: "#fff",
    padding: 6,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontWeight: "400",
    minWidth: 40,
    maxWidth: 40,
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 4,
  },
  emptyDate: {
    width: 40,
    height: 40,
    margin: 2,
  },
  hiddenDate: {
    opacity: 0,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    zIndex: 1,
    minWidth: 40,
    maxWidth: 40,
    minHeight: 40,
    maxHeight: 40,
  },
  calendarDayContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dateContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: "center",
    lineHeight: 16,
  },
  selectedDay: {
    backgroundColor: "#e8e7fc",
    zIndex: 3,
    elevation: 2,
    minWidth: 40,
    maxWidth: 40,
    minHeight: 40,
    maxHeight: 40,
  },
  selectedDayText: {
    color: "#6c63ff",
    fontWeight: "700",
    zIndex: 4,
  },
  otherMonthText: {
    color: "#999999",
  },
  calendarDayMoveTarget: {
    borderColor: "#ffb300",
    borderWidth: 2,
  },
  taskDot: {
    position: 'absolute',
    bottom: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6c63ff',
  },
  todayCircle: {
    backgroundColor: '#6c63ff',
    width: 22,
    height: 22,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    color: 'white', // White for better contrast
    fontWeight: '600',
    fontSize: 14,
  },
  dateTextContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  noTaskContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 48,
  },
  selectedDate: {
    // No background color, just text color change
  },
  selectedDayText: {
    color: '#6c63ff', // Same as add button color
    fontWeight: '600',
  },
  tasksContainer: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  taskAreaContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  taskArea: {
    flex: 1,
    backgroundColor: '#f7f7fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  tasksHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 12,
    width: "100%",
    backgroundColor: '#f7f7fa', // Match tasks container background
    paddingTop: 8,
  },
  tasksHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3d3d4e",
    flex: 1,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  addButton: {
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: '#6c63ff',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  addButtonText: {
    fontSize: 20,
    lineHeight: 24,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  taskList: {
    width: "100%",
    paddingHorizontal: 12,
  },
  taskItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    marginBottom: 8,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  taskText: {
    fontSize: 14,
    color: "#3d3d4e",
    flex: 1,
    lineHeight: 20,
  },
  moveHint: {
    color: "#ffb300",
    fontWeight: "700",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingHorizontal: 0,
    gap: 4, // Add gap if supported by React Native version
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
  },
  saveButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: "#eee",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: "#3d3d4e",
    fontWeight: "700",
    fontSize: 15,
  },
  deleteButton: {
    backgroundColor: "#ff5a5f",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  taskContent: {
    flex: 1,
  },
});
