import ApplicationSerializer from './application';

export default class ScriptSerializer extends ApplicationSerializer {
  attrs =  {
    safeCode: { serialize: false },
  }
  
  /**
   * 'code' is the client's currently saved state of the script text
   *  when saved to the server, 'code' gets sanitzed and passed back as safeCode
   * we do not send up the property safeCode
   * because that is only ever written by the server and read-only by the client
   */
  extractAttributes() {
    let attrs = super.extractAttributes(...arguments);
    attrs['code'] = attrs['safeCode'];
    return attrs;
  }
}
