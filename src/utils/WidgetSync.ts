import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP_IDENTIFIER = 'group.com.cty0305.too.doo.list.data';

export interface WidgetTask {
  id: string;
  title: string;
  completed: boolean;
}

export const syncTasksToWidget = async (tasks: WidgetTask[]) => {
  try {
    // Filter for today's tasks or whatever logic you want for the widget
    // For now, we just pass the tasks provided
    const widgetData = {
      tasks: tasks.slice(0, 5), // Limit to 5 tasks for the widget
      lastUpdated: new Date().toISOString(),
    };

    await SharedGroupPreferences.setItem(
      'widgetData',
      widgetData,
      APP_GROUP_IDENTIFIER
    );
    console.log('Successfully synced tasks to widget');
  } catch (error) {
    console.error('Error syncing tasks to widget:', error);
  }
};
