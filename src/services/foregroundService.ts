import notifee, { AndroidImportance } from '@notifee/react-native';

let serviceStarted = false;

export const startForegroundService = async () => {
  if (serviceStarted) return;

  await notifee.requestPermission(); // Android 13+ notification permission

  const channelId = await notifee.createChannel({
    id: 'sms-forwarder',
    name: 'SMS Forwarder',
    importance: AndroidImportance.LOW,
  });

  await notifee.displayNotification({
    title: 'SMS Forwarder Active',
    body: 'Monitoring incoming messages in the background',
    android: {
      channelId,
      asForegroundService: true,
      ongoing: true,
      smallIcon: 'ic_launcher', // uses your existing app icon
      pressAction: { id: 'default' },
    },
  });

  serviceStarted = true;
  console.log('[SERVICE] Foreground service started');
};

export const stopForegroundService = async () => {
  await notifee.stopForegroundService();
  serviceStarted = false;
};