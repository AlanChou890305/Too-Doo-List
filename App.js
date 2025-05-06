import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  ScrollView,
  PanResponder,
  Dimensions,
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
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [tasks, setTasks] = useState({ [getToday()]: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [moveMode, setMoveMode] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [taskAreaHeight, setTaskAreaHeight] = useState(MIN_TASK_AREA_HEIGHT);
  const [taskText, setTaskText] = useState("");
  const swipeOffset = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const scrollY = useRef(0);
  const [visibleMonth, setVisibleMonth] = useState(new Date().getMonth());
  const [visibleYear, setVisibleYear] = useState(new Date().getFullYear());

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

  const taskAreaPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      // Only handle horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only handle horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderGrant: () => {
      swipeOffset.setOffset(swipeOffset._value);
    },
    onPanResponderRelease: (evt, gestureState) => {
      // 降低觸發閾值到 3
      if (gestureState.dx > 3) {
        handleSwipe("right");
      } else if (gestureState.dx < -3) {
        handleSwipe("left");
      }

      // 添加回彈動畫
      Animated.timing(swipeOffset, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    },
  });

  // 處理拖拉調整高度
  const heightPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newHeight = taskAreaHeight - gestureState.dy;
      if (
        newHeight >= MIN_TASK_AREA_HEIGHT &&
        newHeight <= MAX_TASK_AREA_HEIGHT
      ) {
        setTaskAreaHeight(newHeight);
      }
    },
  });

  // Load tasks from storage
  useEffect(() => {
    AsyncStorage.getItem(TASKS_STORAGE_KEY).then((data) => {
      if (data) {
        const loadedTasks = JSON.parse(data);
        setTasks(loadedTasks);
      }
    });
  }, []);

  // Save tasks to storage
  useEffect(() => {
    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

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
    // Calculate date range: 3 months before and after current date
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 3, 1); // First day of month 3 months ago
    
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 3 + 1, 0); // Last day of month 3 months from now

    // Generate all dates in the range
    const allDates = [];
    const current = new Date(startDate);

    // Make sure we start from the beginning of the week (Sunday)
    const startDay = current.getDay();
    current.setDate(current.getDate() - startDay);

    // Adjust end date to complete the last week
    const end = new Date(endDate);
    const endDay = end.getDay();
    end.setDate(end.getDate() + (6 - endDay));

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const dateObj = new Date(dateStr);

      // Only add dates if they're within our range
      if (dateObj >= startDate && dateObj <= endDate) {
        allDates.push(renderDate(dateStr));
      } else {
        // Add empty view for dates outside our range
        allDates.push(<View key={dateStr} style={styles.emptyDate} />);
      }

      current.setDate(current.getDate() + 1);
    }

    // Group into weeks
    const weeks = [];
    for (let i = 0; i < allDates.length; i += 7) {
      const weekDates = allDates.slice(i, i + 7);
      // Only add weeks that have at least one date in our range
      if (weekDates.some((date) => date.props.style !== styles.emptyDate)) {
        weeks.push(
          <View key={`week-${i}`} style={styles.calendarWeekRow}>
            {weekDates}
          </View>
        );
      }
    }

    return weeks;
  };

  // Handle scroll to update month when crossing month boundaries
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.current = offsetY; // Update scroll position

    const weekHeight = 50; // Approximate height of a week row
    const currentWeek = Math.floor(offsetY / weekHeight);

    // Calculate the current month based on scroll position
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 3, 1); // First day of month 3 months ago
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + currentWeek * 7);

    // Only update if we've scrolled to a new month
    if (
      newDate.getMonth() !== visibleMonth ||
      newDate.getFullYear() !== visibleYear
    ) {
      setVisibleMonth(newDate.getMonth());
      setVisibleYear(newDate.getFullYear());
    }
  };

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
    const isToday = date === getToday();

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
        <View style={styles.calendarDayContent}>
          {isToday && <View style={styles.todayCircle} />}
          <View style={styles.dateContainer}>
            <Text
              style={[
                styles.calendarDayText,
                !isCurrentMonth && styles.otherMonthText,
                isSelected && styles.selectedDayText,
              ]}
            >
              {new Date(date).getDate()}
            </Text>
          </View>
          {tasks[date]?.length > 0 && <View style={styles.taskDot} />}
        </View>
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
      <View
        {...taskAreaPanResponder.panHandlers}
        style={[styles.taskArea, { height: taskAreaHeight }]}
      >
        <View style={styles.resizeHandle} />
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
            style={[styles.tasksContainer, { height: taskAreaHeight }]}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 100, // Add padding at the bottom
              paddingTop: 10, // Add padding at the top
            }}
            horizontal={false}
            showsVerticalScrollIndicator={false}
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
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Fixed Header */}
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

        {/* Scrollable Content */}
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
        <View style={styles.tasksContainer}>{renderTaskArea()}</View>

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
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  weekDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  // Scroll container
  calendarScrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 20,
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
    width: "14%",
    aspectRatio: 1,
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
    color: "#000000",
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

  tasksContainer: {
    backgroundColor: "#f7f7fa",
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 12,
    minHeight: MIN_TASK_AREA_HEIGHT,
  },
  taskArea: {
    borderRadius: 16,
    marginTop: 8,
    position: "relative",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  resizeHandle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  tasksHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 0,
    width: "100%",
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
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
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
    color: "#3d3d4e",
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
