import { helper } from '@ember/component/helper';
import type { Notification } from 'euclip/services/notifications';

export default helper(function styleForNotification(
  [type]: [Notification['type']] /*, named*/
) {
  switch (type) {
    case 'warning':
      return 'bg-washed-yellow dark-orange';
    case 'error':
      return 'bg-washed-red dark-red';
    case 'info':
      return 'bg-light-blue dark-blue';
    case 'success':
      return 'bg-washed-green dark-green';
    default:
      return ''; // You can customize this default value based on your requirements
  }
});