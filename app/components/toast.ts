import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import type NotificationsService from 'euclip/services/notifications';
import { action } from '@ember/object';

export default class ToastComponent extends Component {
  @service declare notifications: NotificationsService;

  @action
  dismiss(idx: number) {
    this.notifications.dismiss(idx);
  }
}
