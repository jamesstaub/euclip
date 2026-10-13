import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export interface Notification {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  action?: () => void;
  /** label of the button that runs `action` (e.g. "Undo") */
  actionLabel?: string;
  /** dismiss itself after this many milliseconds */
  timeout?: number;
}

export default class NotificationsService extends Service {
  @tracked notifications: Notification[] = [];

  // Method to push notifications
  push(notification: Notification) {
    this.notifications = [...this.notifications, notification];
    if (notification.timeout) {
      setTimeout(() => this.remove(notification), notification.timeout);
    }
  }

  remove(notification: Notification) {
    this.notifications = this.notifications.filter((item) => item !== notification);
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
