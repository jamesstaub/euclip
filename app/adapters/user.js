import { inject as service } from '@ember/service';
import ENV from 'euclip/config/environment';
import ApplicationAdapter from './application';

const readStream = async (response) => {
  // Create a ReadableStreamDefaultReader
  const reader = response.body.getReader();

  // Initialize an empty string to store the result
  let result = '';

  // Read chunks of data until the stream is fully consumed
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      // Release the lock when the stream is fully consumed
      reader.releaseLock();
      break;
    }

    // Append the chunk to the result string
    result += new TextDecoder().decode(value);
  }

  return result;
};

export default class UserAdapter extends ApplicationAdapter {
  @service session;

  urlForQueryRecord() {
    return `${ENV.APP.userEndpoint}`;
  }

  urlForFindRecord() {
    return `${super.urlForFindRecord(...arguments)}`;
  }

  urlForCreateRecord() {
    return ENV.APP.registrationEndpoint;
  }

  async ajax(url, type, data) {
    let requestData = {
      url: url,
      method: type,
    };

    const params = {
      method: type,
      headers: this.headers,
    };

    if (type !== 'GET') {
      params.body = JSON.stringify(data.data);
    }

    const response = await fetch(url, params);

    const body = JSON.parse(await readStream(response));

    // console.log(super.ajax.toString());
    if (response.ok) {
      return this.fetchSuccessHandler(body, response, requestData);
    } else {
      throw new Error(body.errors);
    }
  }

  fetchSuccessHandler(body) {
    return body;
  }
  fetchErrorHandler(body) {
    return body;
  }
}
