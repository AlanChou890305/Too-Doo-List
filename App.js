import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";

const TASKS_STORAGE_KEY = "TASKS_STORAGE_KEY";
const MIN_TASK_AREA_HEIGHT = 300; // 最小高度
const MAX_TASK_AREA_HEIGHT = Dimensions.get("window").height * 0.8; // 最大高度為螢幕高度的80%

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function App() {
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [tasks, setTasks] = useState({});
  const [inputText, setInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [modalVisible, setModalVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(new Date(getCurrentDate()).getMonth());
  const [visibleYear, setVisibleYear] = useState(new Date(getCurrentDate()).getFullYear());
  const [taskAreaHeight, setTaskAreaHeight] = useState(MIN_TASK_AREA_HEIGHT);
  const [taskText, setTaskText] = useState("");
  const swipeOffset = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const scrollY = useRef(0);

  // Calculate task area height based on content
  const calculateTaskAreaHeight = () => {
    const tasksCount = tasks[selectedDate]?.length || 0;
    const headerHeight = 60; // Header height (date + add button)
    const taskHeight = 64; // Each task height including margin
    const minPadding = 20;
    const contentHeight = headerHeight + tasksCount * taskHeight + minPadding;
    return Math.min(
      Math.max(MIN_TASK_AREA_HEIGHT, contentHeight),
      MAX_TASK_AREA_HEIGHT
    );
  };

  // Update task area height when tasks change
  useEffect(() => {
    const newHeight = calculateTaskAreaHeight();
    setTaskAreaHeight(newHeight);
  }, [tasks]);

  // Calendar navigation functions
  const goToNextMonth = () => {
    setSelectedDate(addDays(selectedDate, 30));
  };

  const goToPrevMonth = () => {
    setSelectedDate(addDays(selectedDate, -30));
  };

  // 日期格式化函數
  const formatDate = (date) => {
    if (!date) return "";
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 日期處理函數
  const addDays = (dateString, days) => {
    try {
      if (!dateString) return getToday();
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return getToday();
      date.setDate(date.getDate() + days);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error in addDays:", error);
      return getToday();
    }
  };

  // 處理滑動事件
  const handleSwipe = (direction) => {
    try {
      if (direction === "left") {
        const newDate = addDays(selectedDate, 1);
        setSelectedDate(newDate);
      } else if (direction === "right") {
        const newDate = addDays(selectedDate, -1);
        setSelectedDate(newDate);
      }
    } catch (error) {
      console.error("Error in handleSwipe:", error);
      setSelectedDate(getToday());
    }
  };

  const { height: screenHeight } = Dimensions.get('window');
  const pan = useRef(new Animated.Value(MIN_TASK_AREA_HEIGHT)).current;
  const currentHeight = useRef(MIN_TASK_AREA_HEIGHT);

  // Disabled drag interaction
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: () => {},
    onPanResponderMove: () => {},
    onPanResponderRelease: () => {},
  });

  // Handle horizontal swipes for date navigation
  const handleSwipeGesture = (evt, gestureState) => {
    if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
      if (gestureState.dx > 3) {
        handleSwipe("right");
      } else if (gestureState.dx < -3) {
        handleSwipe("left");
      }
    }
  };

  // Load tasks from storage and set initial scroll position
  useEffect(() => {
    AsyncStorage.getItem(TASKS_STORAGE_KEY).then((data) => {
      if (data) {
        const loadedTasks = JSON.parse(data);
        setTasks(loadedTasks);
      }
    }).then(() => {
      // After loading tasks, ensure we have the correct date selected
      const today = getToday();
      setSelectedDate(today);
    });
  }, []);

  // Save tasks to storage
  useEffect(() => {
    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Ensure today's date is selected and centered when app loads
  useEffect(() => {
    const today = getToday();
    setSelectedDate(today);
    
    // Function to center today's week in the calendar
    const centerToday = () => {
      if (!scrollViewRef.current) return;
      
      const todayDate = new Date(today);
      todayDate.setHours(12, 0, 0, 0);
      
      // Calculate the start date of the calendar (3 months before current month)
      const startDate = new Date(todayDate);
      startDate.setMonth(todayDate.getMonth() - 3);
      startDate.setDate(1);
      startDate.setHours(12, 0, 0, 0);
      
      // Find the first Sunday on or before the start date
      const firstDayOfWeek = startDate.getDay();
      const firstSunday = new Date(startDate);
      firstSunday.setDate(startDate.getDate() - firstDayOfWeek);
      firstSunday.setHours(12, 0, 0, 0);
      
      // Calculate the number of weeks between first Sunday and today
      const diffInDays = Math.floor((todayDate - firstSunday) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(diffInDays / 7);
      
      // Calculate scroll position to center today's week
      const weekHeight = 50; // Height of each week row
      const visibleWeeks = 4; // Number of weeks visible on screen
      const scrollPosition = (weekNumber * weekHeight) - ((visibleWeeks / 2) * weekHeight);
      
      // Scroll to position with animation
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: true
      });
    };
    
    // Initial scroll after a short delay
    const timer1 = setTimeout(centerToday, 100);
    
    // Additional scroll after layout is complete
    const timer2 = setTimeout(centerToday, 300);
    
    // One more attempt after a longer delay
    const timer3 = setTimeout(centerToday, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const openAddTask = (date) => {
    setEditingTask(null);
    setTaskText("");
    setSelectedDate(date);
    setModalVisible(true);
  };

  const openEditTask = (task) => {
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
    if (task.date !== selectedDate) return;
    const dayTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
    const filteredTasks = dayTasks.filter((t) => t.id !== task.id);
    setTasks({ ...tasks, [selectedDate]: filteredTasks });
    setModalVisible(false);
    setEditingTask(null);
    setTaskText("");
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
    
    return weeks;
  };

  // Handle scroll to update month when crossing month boundaries
  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.current = offsetY;

    const weekHeight = 50; // Approximate height of a week row
    const currentWeek = Math.floor(offsetY / weekHeight);

    // Calculate the current month based on scroll position
    const today = new Date(getCurrentDate());
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Calculate the same way as in renderCalendar
    const startMonth = currentMonth - 3;
    const startYear = currentYear + Math.floor(startMonth / 12);
    const adjustedStartMonth = ((startMonth % 12) + 12) % 12;
    const startDate = new Date(startYear, adjustedStartMonth, 1);
    
    // Calculate the new date based on weeks scrolled
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + currentWeek * 7);

    // Only update if we've scrolled to a new month
    if (
      newDate.getMonth() !== visibleMonth ||
      newDate.getFullYear() !== visibleYear
    ) {
      setVisibleMonth(newDate.getMonth());
      setVisibleYear(newDate.getFullYear());
    }
  }, [visibleMonth, visibleYear]);

  const handleDateSelect = (date) => {
    const newDate = new Date(date);

    // Only update the selected date and month header
    setSelectedDate(date);

    // Update the visible month in the header if needed
    if (
      newDate.getMonth() !== visibleMonth ||
      newDate.getFullYear() !== visibleYear
    ) {
      setVisibleMonth(newDate.getMonth());
      setVisibleYear(newDate.getFullYear());
    }

    // Prevent any default behavior that might cause scrolling
    return false;
  };

  // Simplified renderMonthWeeks since we're handling dates differently now
  const renderMonthWeeks = () => [];

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
            handleDateSelect(date);
          }
        }}
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          moveMode && styles.calendarDayMoveTarget,
        ]}
      >
        {renderDateContent()}
        {tasks[date]?.length > 0 && <View style={styles.taskDot} />}
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
  const renderTaskArea = () => {
    return (
      <View style={styles.taskAreaContainer}>
        <Animated.View 
          style={[
            styles.taskArea, 
            { 
              height: pan.interpolate({
                inputRange: [MIN_TASK_AREA_HEIGHT, screenHeight * 0.9],
                outputRange: [MIN_TASK_AREA_HEIGHT, screenHeight * 0.9],
                extrapolate: 'clamp',
              })
            }
          ]}
        >
          <View 
            style={styles.dragHandleContainer}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragHandle} />
          </View>
          <View style={[styles.taskAreaContent, { height: taskAreaHeight - 30 }]}>
            <View style={styles.tasksHeaderRow}>
              <Text style={styles.tasksHeader}>{formatDate(selectedDate)}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openAddTask(selectedDate)}
                activeOpacity={0.7}
              >
                <View style={styles.addButtonIcon}>
                  <Text style={styles.addButtonText}>+</Text>
                </View>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.tasksScrollView}
              contentContainerStyle={styles.tasksScrollContent}
              showsVerticalScrollIndicator={false}
              horizontal={false}
            >
              {tasks[selectedDate]?.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.taskItem}
                  onPress={() => openEditTask(item)}
                  onLongPress={() => startMoveTask(item)}
                >
                  <Text style={styles.taskText}>{item.text}</Text>
                  {moveMode && taskToMove && taskToMove.id === item.id && (
                    <Text style={styles.moveHint}>Tap a date to move</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.fixedHeader}>
          <Text style={styles.currentMonthTitle}>
            {visibleYear}年{visibleMonth + 1}月
          </Text>
          <View style={styles.weekDaysHeader}>
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Calendar Section */}
          <View style={styles.calendarContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.calendarScrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              onScrollBeginDrag={(event) => {
                scrollY.current = event.nativeEvent.contentOffset.y;
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.scrollSpacer} />
              {renderCalendar()}
              <View style={styles.scrollSpacer} />
            </ScrollView>
          </View>
          
          {/* Tasks Section */}
          <View style={styles.tasksContainer}>
            {renderTaskArea()}
          </View>
        </View>

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
                {editingTask ? "編輯任務" : "新增任務"}
              </Text>
              <TextInput
                style={styles.input}
                value={taskText}
                onChangeText={setTaskText}
                placeholder="任務描述"
                autoFocus
              />
              <View style={styles.modalButtons}>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveTask}
                  >
                    <Text style={styles.saveButtonText}>儲存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  {editingTask && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert("確認刪除", "確定要刪除這個任務嗎？", [
                          { text: "取消", style: "cancel" },
                          {
                            text: "確定",
                            style: "destructive",
                            onPress: () => deleteTask(editingTask),
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>刪除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7fa",
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  calendarContainer: {
    flexShrink: 0,
    backgroundColor: '#fff',
  },
  // Header styles
  fixedHeader: {
    backgroundColor: "#fff",
    paddingTop: 10,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentMonthTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "left",
    marginBottom: 10,
    marginLeft: 16,
  },
  weekDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  // Scroll container
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
  calendarTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 15,
    color: "#3d3d4e",
    textAlign: "center",
  },
  calendarWeekHeader: {
    // Empty as we moved the week header to be fixed
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
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6c63ff',
  },
  todayCircle: {
    backgroundColor: '#6c63ff', // Matches add button color
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  dragHandleContainer: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7fa', // Match tasks container background
  },
  dragHandle: {
    width: 60,
    height: 5,
    backgroundColor: '#888',
    borderRadius: 3,
    opacity: 0.8,
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
    backgroundColor: "#6c63ff",
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
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
