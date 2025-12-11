import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * 根據提醒時間點生成個性化的通知文字
 * @param {number} minutesBefore - 任務前幾分鐘提醒
 * @param {Object} translations - 多語系翻譯物件
 * @returns {Object} - 包含 title 和 body 的物件
 */
function getNotificationText(minutesBefore, translations) {
  switch (minutesBefore) {
    case 30:
      return {
        title: translations.reminder30minTitle || "Task Starting Soon",
        body:
          translations.reminder30minBody ||
          "Your task is starting in 30 minutes",
      };
    case 10:
      return {
        title: translations.reminder10minTitle || "Task Starting Soon",
        body:
          translations.reminder10minBody ||
          "Your task is starting in 10 minutes",
      };
    case 5:
      return {
        title: translations.reminder5minTitle || "Task Starting Soon",
        body:
          translations.reminder5minBody || "Your task is starting in 5 minutes",
      };
    default:
      return {
        title: translations.taskReminder || "Task Reminder",
        body: `Your task is starting in ${minutesBefore} minutes`,
      };
  }
}

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
 * @returns {Promise<boolean>} - 是否成功獲得權限
 */
export async function registerForPushNotificationsAsync() {
  try {
    console.log("🔔 Requesting notification permissions...");
    
    // 檢查 Notifications 是否可用
    if (!Notifications) {
      console.error("❌ Notifications module is undefined");
      return false;
    }

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#6c63ff",
        });
        console.log("✅ Android notification channel set");
      } catch (error) {
        console.error("❌ Error setting Android notification channel:", error);
      }
    }

    // 獲取現有權限狀態
    const existingPermissions = await Notifications.getPermissionsAsync();
    console.log("📋 Existing permissions:", existingPermissions);
    
    if (!existingPermissions) {
      console.error("❌ Failed to get existing permissions");
      return false;
    }

    const existingStatus = existingPermissions.status || "undetermined";
    let finalStatus = existingStatus;

    console.log("📊 Current permission status:", existingStatus);

    // 如果權限未授予，則請求權限
    if (existingStatus !== "granted") {
      console.log("📝 Requesting notification permissions...");
      const requestResult = await Notifications.requestPermissionsAsync();
      console.log("📋 Request result:", requestResult);
      
      if (!requestResult) {
        console.error("❌ Request permissions returned undefined");
        return false;
      }
      
      finalStatus = requestResult.status || "undetermined";
      console.log("📊 Final permission status:", finalStatus);
    }

    const isGranted = finalStatus === "granted";
    console.log(isGranted ? "✅ Notification permissions granted" : "❌ Notification permissions denied");
    
    return isGranted;
  } catch (error) {
    console.error("❌ Error requesting notification permissions:", error);
    console.error("   Error message:", error?.message || "Unknown error");
    console.error("   Error stack:", error?.stack || "No stack trace");
    return false;
  }
}

/**
 * 安排任務提醒通知（支援多個提醒時間點）
 * @param {Object} task - 任務物件
 * @param {string} task.id - 任務 ID
 * @param {string} task.title - 任務標題（必需）
 * @param {string} task.date - 任務日期 (YYYY-MM-DD)
 * @param {string} task.time - 任務時間 (HH:MM)
 * @param {string} reminderText - 提醒文字（多語系）
 * @param {Array<number>} reminderMinutes - 提醒時間點陣列（任務前幾分鐘），預設 [30]
 * @param {Object} userReminderSettings - 用戶提醒設定
 * @returns {Promise<Array<string>>} - 通知 ID 陣列
 */
export async function scheduleTaskNotification(
  task,
  reminderText = "Task Reminder",
  reminderMinutes = null, // 如果為 null，則從用戶設定中讀取
  userReminderSettings = null,
  translations = null // 新增多語系翻譯參數
) {
  try {
    // 驗證必需欄位
    if (!task.title) {
      console.warn("Task missing title, skipping notification");
      return [];
    }

    // 如果沒有設定時間，則不安排通知
    if (!task.time || !task.date) {
      console.log("Task has no time set, skipping notification");
      return [];
    }

    // 檢查用戶提醒設定
    if (userReminderSettings && !userReminderSettings.enabled) {
      console.log("User has disabled reminders, skipping notification");
      return [];
    }

    // 決定使用哪個提醒時間設定
    let finalReminderMinutes = reminderMinutes;
    if (
      reminderMinutes === null &&
      userReminderSettings &&
      userReminderSettings.times
    ) {
      finalReminderMinutes = userReminderSettings.times;
    } else if (reminderMinutes === null) {
      finalReminderMinutes = [30]; // 預設值
    }

    // 解析日期和時間
    const [year, month, day] = task.date.split("-").map(Number);
    const [hours, minutes] = task.time.split(":").map(Number);

    // 創建任務時間
    const taskTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    // 1. 先取消該任務的所有舊通知
    // 我們現在使用 taskId 來查找並取消所有相關通知，而不是依賴傳入的 notificationIds
    await cancelTaskNotification(null, task.id);

    const scheduledNotificationIds = [];

    // 為每個提醒時間點安排通知
    for (const minutesBefore of finalReminderMinutes) {
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

      // 生成個性化的通知文字
      const notificationText = getNotificationText(
        minutesBefore,
        translations || {}
      );

      // 使用確定性的 identifier，這樣可以避免重複並容易追蹤
      // 格式: task-{taskId}-{minutesBefore}
      const identifier = `task-${task.id}-${minutesBefore}`;

      // 使用任務標題（已在函數開頭驗證，確保存在）
      const taskTitle = task.title;

      // 準備通知內容
      const notificationContent = {
        identifier: identifier, // 指定 ID，防止重複
        content: {
          title: notificationText?.title || "Task Reminder",
          body: `${notificationText?.body || "Your task is starting soon"}: ${taskTitle}`,
          data: {
            taskId: task.id,
            minutesBefore: minutesBefore,
            type: "task_reminder",
          },
          sound: true,
        },
        trigger: reminderTime,
      };

      // iOS 不需要 priority，Android 才需要
      if (Platform.OS === "android") {
        notificationContent.content.priority = Notifications.AndroidNotificationPriority.HIGH;
      }

      // 安排通知
      const notificationId = await Notifications.scheduleNotificationAsync(notificationContent);

      // 驗證 notificationId
      if (notificationId) {
        scheduledNotificationIds.push(notificationId);
      } else {
        console.warn(`⚠️ Notification ID is undefined for task ${task.id}, minutesBefore: ${minutesBefore}`);
      }

      console.log(`✅ Notification scheduled (${minutesBefore}min before)`);
      console.log(`   Task: ${taskTitle}`);
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
 * 取消任務通知
 * @param {string|Array<string>} notificationIds - (已棄用，保留相容性) 通知 ID 或通知 ID 陣列
 * @param {string} taskId - 任務 ID (推薦使用)
 */
export async function cancelTaskNotification(notificationIds, taskId = null) {
  try {
    // 如果提供了 taskId，則查找並取消該任務的所有通知
    if (taskId) {
      console.log(`🔍 Cancelling notifications for Task ID: ${taskId}`);
      
      // 獲取所有已安排的通知
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      // 篩選出屬於該任務的通知
      const taskNotifications = allScheduled.filter(
        (n) => n.content.data && n.content.data.taskId === taskId
      );
      
      if (taskNotifications.length > 0) {
        console.log(`Found ${taskNotifications.length} notifications to cancel`);
        for (const notification of taskNotifications) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log(`✅ Cancelled notification: ${notification.identifier}`);
        }
      } else {
        console.log("No existing notifications found for this task");
      }
      
      // 額外保險：嘗試取消可能的確定性 ID
      // 即使 getAllScheduledNotificationsAsync 漏掉（極少見），這也能確保清理
      const commonTimes = [30, 10, 5];
      for (const time of commonTimes) {
        const potentialId = `task-${taskId}-${time}`;
        try {
          await Notifications.cancelScheduledNotificationAsync(potentialId);
        } catch (e) {
          // 忽略錯誤，可能不存在
        }
      }
      
      return;
    }

    // 向後兼容：如果只提供了 notificationIds
    if (notificationIds) {
      const idsArray = Array.isArray(notificationIds)
        ? notificationIds
        : [notificationIds];

      for (const id of idsArray) {
        if (id) {
          await Notifications.cancelScheduledNotificationAsync(id);
          console.log(`✅ Notification cancelled (by ID): ${id}`);
        }
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
 * @returns {Promise<Array>} - 通知陣列，永遠不會返回 undefined
 */
export async function getAllScheduledNotifications() {
  try {
    if (!Notifications) {
      console.error("❌ Notifications module is undefined");
      return [];
    }

    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    
    if (!notifications) {
      console.warn("⚠️ getAllScheduledNotificationsAsync returned undefined");
      return [];
    }

    if (!Array.isArray(notifications)) {
      console.warn("⚠️ getAllScheduledNotificationsAsync did not return an array:", typeof notifications);
      return [];
    }

    console.log(`📋 Scheduled notifications: ${notifications.length}`);
    return notifications;
  } catch (error) {
    console.error("❌ Error getting scheduled notifications:", error);
    console.error("   Error message:", error?.message || "Unknown error");
    return [];
  }
}

/**
 * 發送測試通知（用於測試通知功能）
 * @param {number} secondsFromNow - 幾秒後發送通知，預設 5 秒
 * @returns {Promise<string|null>} - 通知 ID 或 null
 */
export async function sendTestNotification(secondsFromNow = 5) {
  try {
    console.log("🔔 Starting test notification...");
    
    // 檢查 Notifications 是否可用
    if (!Notifications) {
      console.error("❌ Notifications module is undefined");
      return null;
    }

    // 檢查通知權限
    const permissions = await Notifications.getPermissionsAsync();
    console.log("📋 Permission status:", permissions);
    
    if (!permissions || permissions.status !== "granted") {
      console.warn("⚠️ Notification permission not granted. Status:", permissions?.status || "undefined");
      return null;
    }

    // 計算通知時間
    const triggerTime = new Date(Date.now() + secondsFromNow * 1000);
    console.log("⏰ Trigger time:", triggerTime.toLocaleString());
    
    // 準備通知內容
    const notificationContent = {
      identifier: `test-notification-${Date.now()}`,
      content: {
        title: "測試通知",
        body: `這是一個測試通知，將在 ${secondsFromNow} 秒後顯示`,
        data: {
          type: "test",
          timestamp: Date.now(),
        },
        sound: true,
      },
      trigger: triggerTime,
    };

    // iOS 不需要 priority，Android 才需要
    if (Platform.OS === "android") {
      notificationContent.content.priority = Notifications.AndroidNotificationPriority.HIGH;
    }

    console.log("📤 Scheduling notification with content:", JSON.stringify(notificationContent, null, 2));
    
    // 發送測試通知
    const notificationId = await Notifications.scheduleNotificationAsync(notificationContent);

    console.log(`✅ Test notification scheduled successfully`);
    console.log(`   Notification ID: ${notificationId || "undefined"}`);
    console.log(`   Will appear in ${secondsFromNow} seconds`);
    console.log(`   Trigger time: ${triggerTime.toLocaleString()}`);
    
    // 驗證 notificationId
    if (!notificationId) {
      console.warn("⚠️ Notification ID is undefined or null");
      return null;
    }

    return notificationId;
  } catch (error) {
    console.error("❌ Error sending test notification:", error);
    console.error("   Error message:", error?.message || "Unknown error");
    console.error("   Error stack:", error?.stack || "No stack trace");
    return null;
  }
}
