import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 設定通知處理器
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * 請求通知權限
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6c63ff",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return null;
  }

  return finalStatus === "granted";
}

/**
 * 安排任務提醒通知（支援多個提醒時間點）
 * @param {Object} task - 任務物件
 * @param {string} task.id - 任務 ID
 * @param {string} task.text - 任務文字
 * @param {string} task.date - 任務日期 (YYYY-MM-DD)
 * @param {string} task.time - 任務時間 (HH:MM)
 * @param {string} reminderText - 提醒文字（多語系）
 * @param {Array<number>} reminderMinutes - 提醒時間點陣列（任務前幾分鐘），預設 [30]
 * @returns {Promise<Array<string>>} - 通知 ID 陣列
 */
export async function scheduleTaskNotification(
  task,
  reminderText = "Task Reminder",
  reminderMinutes = [30] // 預設任務前 30 分鐘，未來可改為 [30, 10]
) {
  try {
    // 如果沒有設定時間，則不安排通知
    if (!task.time || !task.date) {
      console.log("Task has no time set, skipping notification");
      return [];
    }

    // 解析日期和時間
    const [year, month, day] = task.date.split("-").map(Number);
    const [hours, minutes] = task.time.split(":").map(Number);

    // 創建任務時間
    const taskTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    // 先取消舊的通知（如果存在）
    if (task.notificationIds && Array.isArray(task.notificationIds)) {
      for (const id of task.notificationIds) {
        await cancelTaskNotification(id);
      }
    } else if (task.notificationId) {
      // 向後兼容：支援舊的單一 notificationId
      await cancelTaskNotification(task.notificationId);
    }

    const scheduledNotificationIds = [];

    // 為每個提醒時間點安排通知
    for (const minutesBefore of reminderMinutes) {
      // 計算提醒時間
      const reminderTime = new Date(
        taskTime.getTime() - minutesBefore * 60 * 1000
      );

      // 檢查提醒時間是否在未來
      if (reminderTime <= now) {
        console.log(
          `⏭️  Skipping ${minutesBefore}min reminder (time is in the past)`
        );
        continue;
      }

      // 安排通知
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderText,
          body: task.text,
          data: {
            taskId: task.id,
            minutesBefore: minutesBefore,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: reminderTime,
      });

      scheduledNotificationIds.push(notificationId);

      console.log(`✅ Notification scheduled (${minutesBefore}min before)`);
      console.log(`   Task: ${task.text}`);
      console.log(`   Task time: ${taskTime.toLocaleString()}`);
      console.log(`   Reminder time: ${reminderTime.toLocaleString()}`);
      console.log(`   Notification ID: ${notificationId}`);
    }

    return scheduledNotificationIds;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return [];
  }
}

/**
 * 取消任務通知（支援單一 ID 或 ID 陣列）
 * @param {string|Array<string>} notificationIds - 通知 ID 或通知 ID 陣列
 */
export async function cancelTaskNotification(notificationIds) {
  try {
    if (!notificationIds) return;

    // 支援單一 ID 或陣列
    const idsArray = Array.isArray(notificationIds)
      ? notificationIds
      : [notificationIds];

    for (const id of idsArray) {
      if (id) {
        await Notifications.cancelScheduledNotificationAsync(id);
        console.log(`✅ Notification cancelled: ${id}`);
      }
    }
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
}

/**
 * 取消所有通知
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("✅ All notifications cancelled");
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
}

/**
 * 獲取所有已安排的通知
 */
export async function getAllScheduledNotifications() {
  try {
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 Scheduled notifications: ${notifications.length}`);
    return notifications;
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
}
