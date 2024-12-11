import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  IonContent,
  IonDatetime,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    IonItemDivider,
    IonLabel,
    IonItem,
    IonList,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonToggle,
    IonDatetime
  ],
})
export class Tab3Page {
  darkMode: boolean = false;
  notifications: boolean = false;
  selectedTime: string = '09:00';
  version: string = '1.0.0';
  notificationId: number = 1;

  constructor(private toastController: ToastController) {
    this.initializeDarkMode();
    this.initializeNotificationSettings();
    this.checkNotificationPermissions();
    this.setupNotificationListeners();
  }

  private async setupNotificationListeners() {
    await LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });

    await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notification action performed:', notification);
    });
  }

  private async checkNotificationPermissions() {
    const { display } = await LocalNotifications.checkPermissions();

    if (display === 'prompt') {
      const { display: finalStatus } = await LocalNotifications.requestPermissions();
      if (finalStatus !== 'granted') {
        this.notifications = false;
        localStorage.setItem('notifications', 'false');
        this.showToast('Notifications permission denied');
        return false;
      }
    }
    return display === 'granted';
  }

  private initializeDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      this.darkMode = JSON.parse(savedDarkMode);
      this.applyTheme(this.darkMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.darkMode = prefersDark.matches;
      this.applyTheme(this.darkMode);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mediaQuery) => {
      if (localStorage.getItem('darkMode') === null) {
        this.darkMode = mediaQuery.matches;
        this.applyTheme(this.darkMode);
      }
    });
  }

  private initializeNotificationSettings() {
    const savedNotifications = localStorage.getItem('notifications');
    const savedTime = localStorage.getItem('notificationTime');

    if (savedNotifications !== null) {
      this.notifications = JSON.parse(savedNotifications);
      if (this.notifications) {
        this.scheduleNotifications();
      }
    }
    if (savedTime !== null) {
      this.selectedTime = savedTime;
    }
  }

  onDarkModeToggle(event: any) {
    this.darkMode = event.detail.checked;
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    this.applyTheme(this.darkMode);
  }

  async onNotificationToggle(event: any) {
    this.notifications = event.detail.checked;
    localStorage.setItem('notifications', JSON.stringify(this.notifications));

    if (this.notifications) {
      const permissionGranted = await this.checkNotificationPermissions();
      if (permissionGranted) {
        await this.scheduleNotifications();
        this.showToast('Daily journal reminder set');
      }
    } else {
      await this.cancelNotifications();
      this.showToast('Journal reminders turned off');
    }
  }

  async onTimeChange(event: any) {
    this.selectedTime = event.detail.value;
    localStorage.setItem('notificationTime', this.selectedTime);
    if (this.notifications) {
      await this.cancelNotifications();
      await this.scheduleNotifications();
      this.showToast('Reminder time updated');
    }
  }

  private async scheduleNotifications() {
    try {
      const [hours, minutes] = this.selectedTime.split(':').map(Number);

      // Calculate the next occurrence of the selected time
      const now = new Date();
      let scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0);

      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      // Set up the notification channel first (Android only)
      if (Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'journal-reminders',
          name: 'Journal Reminders',
          description: 'Daily reminders to write in your journal',
          importance: 5,
          visibility: 1,
          sound: 'default',
          lights: true
        });
      }

      // Schedule the notification
      await LocalNotifications.schedule({
        notifications: [{
          id: this.notificationId,
          title: '📝 Journal Time!',
          body: "Time to write today's memories in your journal!",
          schedule: {
            at: scheduledTime,
            allowWhileIdle: true,
            every: 'day',
          },
          autoCancel: true,
          sound: 'default',
          smallIcon: 'ic_launcher_round',
          iconColor: '#488AFF',
          largeIcon: 'ic_launcher_round',
          channelId: 'journal-reminders',
          extra: {
            data: 'journal-reminder'
          }
        }]
      });

    } catch (error) {
      console.error('Error scheduling notification:', error);
      this.showToast('Failed to set notification');
    }
  }

  private async cancelNotifications() {
    try {
      await LocalNotifications.cancel({
        notifications: [{
          id: this.notificationId
        }]
      });
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  private applyTheme(dark: boolean) {
    document.body.classList.toggle('dark', dark);
    const components = document.querySelectorAll(
      'ion-content, ion-toolbar, ion-list, ion-item, ion-tab-bar, ion-tab-button'
    );
    components.forEach(component => {
      component.classList.toggle('dark', dark);
    });
  }
}
