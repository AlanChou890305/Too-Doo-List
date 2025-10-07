// 任務相關的類型定義和常數
// 這個文件提供了類型安全和欄位驗證

// 任務欄位常數 - 避免硬編碼欄位名稱
export const TASK_FIELDS = {
  // 基本欄位
  ID: "id",
  USER_ID: "user_id",
  USER_DISPLAY_NAME: "user_display_name",
  TEXT: "title",
  TIME: "time",
  DATE: "date",
  CHECKED: "checked",

  // 擴展欄位
  PRIORITY: "priority",
  DESCRIPTION: "description",
  DUE_TIME: "due_time",
  IS_COMPLETED: "is_completed",
  COMPLETED_AT: "completed_at",
  TAGS: "tags",
  ORDER_INDEX: "order_index",

  // 時間戳
  CREATED_AT: "created_at",
  UPDATED_AT: "updated_at",
};

// 任務優先級常數
export const TASK_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

// 任務狀態常數
export const TASK_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// 驗證任務欄位是否存在於資料庫
export const validateTaskFields = (fields) => {
  const validFields = {};
  const invalidFields = [];

  Object.entries(fields).forEach(([key, value]) => {
    if (Object.values(TASK_FIELDS).includes(key)) {
      validFields[key] = value;
    } else {
      invalidFields.push(key);
    }
  });

  if (invalidFields.length > 0) {
    console.warn("⚠️ Invalid task fields detected:", invalidFields);
    console.warn("Valid fields are:", Object.values(TASK_FIELDS));
  }

  return validFields;
};

// 創建安全的任務物件
export const createTaskObject = (taskData) => {
  const safeTask = {
    [TASK_FIELDS.USER_ID]: taskData.user_id,
    [TASK_FIELDS.USER_DISPLAY_NAME]: taskData.user_display_name,
    [TASK_FIELDS.TEXT]: taskData.title,
    [TASK_FIELDS.TIME]: taskData.time || null,
    [TASK_FIELDS.DATE]: taskData.date,
    [TASK_FIELDS.CHECKED]: taskData.checked || false,
    [TASK_FIELDS.PRIORITY]: taskData.priority || TASK_PRIORITIES.MEDIUM,
    [TASK_FIELDS.DESCRIPTION]: taskData.description || null,
    [TASK_FIELDS.DUE_TIME]: taskData.due_time || null,
    [TASK_FIELDS.IS_COMPLETED]: taskData.is_completed || false,
    [TASK_FIELDS.COMPLETED_AT]: taskData.completed_at || null,
    [TASK_FIELDS.TAGS]: taskData.tags || [],
    [TASK_FIELDS.ORDER_INDEX]: taskData.order_index || 0,
  };

  return validateTaskFields(safeTask);
};

// 檢查任務欄位是否完整
export const validateTaskCompleteness = (task) => {
  const requiredFields = [
    TASK_FIELDS.USER_ID,
    TASK_FIELDS.TEXT,
    TASK_FIELDS.DATE,
  ];

  const missingFields = requiredFields.filter((field) => !task[field]);

  if (missingFields.length > 0) {
    console.error("❌ Missing required task fields:", missingFields);
    return false;
  }

  return true;
};
