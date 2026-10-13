import Component from '@glimmer/component';
import { service } from '@ember/service';
import type NotificationsService from 'euclip/services/notifications';
import type { Notification } from 'euclip/services/notifications';
import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';

export default class ToastComponent extends Component {
  @service declare notifications: NotificationsService;
  @service declare router: RouterService;

  constructor() {
    super(...arguments);
    this.router.on('routeDidChange', (transition) => {
      this.notifications.dismissAll();
    });
  }

  @action
  dismiss(idx: number) {
    this.notifications.dismiss(idx);
  }

  // the notification's own button (e.g. Undo): run it, then the toast has done its job
  @action
  runAction(notification: Notification) {
    notification.action?.();
    this.notifications.remove(notification);
  }
}
