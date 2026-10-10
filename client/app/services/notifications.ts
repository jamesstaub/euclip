import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export interface Notification {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  action?: () => void;
}

export default class NotificationsService extends Service {
  @tracked notifications: Notification[] = [];

  // Method to push notifications
  push(notification: Notification) {
    this.notifications = [...this.notifications, notification];
  }

  dismiss(itemIdx: number) {
    this.notifications = this.notifications.filter(
      (item, idx) => idx != itemIdx
    );
  }

  dismissAll() {
    this.notifications = [];
  }
}
