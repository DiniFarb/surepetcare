const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const baseURL = "https://app.api.surehub.io/api";

class PetCareAPI {

  #credentials;
  #token;
  loggedInUserId;

  constructor(credentials){
    if(!credentials.mail) throw new Error('Petcare API user email address can not be undefined');
    if(!credentials.password) throw new Error('Petcare API user password can not be undefined');
    this.#credentials = credentials;
  }

  async login() {
    try {
      const response = await fetch(`${baseURL}/auth/login`, {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "content-type": "application/json",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "sec-gpc": "1",
          "x-app-version": "browser",
        },
        referrer: "https://www.surepetcare.io/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `{\"email_address\":\"${this.#credentials.mail}\",
                \"password\":\"${this.#credentials.password}\",
                \"device_id\":\"${null}\"}`,
        method: "POST",
        mode: "cors",
        credentials: "omit",
      });
      if (!response.ok) throw Error(`unexpected response ${response.statusText} ,status code ${response.status}`);
      const json_response = await response.json();
      this.#token = json_response.data.token;
      this.loggedInUserId = json_response.data.user.id;
      return true;
    } catch (err) {
        throw `Petcare | login failed: ${err}`;
    }
  }

  async getMetaData() {
    try {
      const response = await fetch(`${baseURL}/start`, {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          authorization: `Bearer ${this.#token}`,
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "sec-gpc": "1",
          "x-app-version": "browser",
        },
        referrer: "https://www.surepetcare.io/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
      });
      if (!response.ok) throw Error(`unexpected response ${response.statusText}, status code ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      throw `Petcare | GET metadata failed: ${err}`;
    }
  }

  async getUpdate() {
    try {
      const response = await fetch(`${baseURL}/me/start`, {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${this.#token}`,
          "x-app-version": "browser",
        },
        referrer: "https://www.surepetcare.io/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
      });
      if (!response.ok) throw Error(`unexpected response ${response.statusText}, status code ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      throw `Petcare | GET update failed: ${err}`;
    }
  }

  async toggleDoor(doorId, command) {
    try {
      const response = await fetch(`${baseURL}/device/${doorId}/control`, {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${this.#token}`,
          "content-type": "application/json",
          "x-app-version": "browser",
        },
        referrer: "https://www.surepetcare.io/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `{\"locking\":${command}}`,
        method: "PUT",
        mode: "cors",
      });
      if (!response.ok) throw Error(`unexpected response ${response.statusText}, status code ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      throw `Petcare | toggle door with ID ${doorId} failed: ${err}`;
    }
  }

  async resetFeeder(tareNumber, deviceId) {
    try {
      const response = await fetch(`${baseURL}/device/${deviceId}/control`, {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${this.#token}`,
          "content-type": "application/json",
          "x-app-version": "browser",
        },
        referrer: "https://surepetcare.io/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `{\"tare\":${tareNumber}}`,
        method: "PUT",
        mode: "cors",
        credentials: "include",
      });
      if (!response.ok) throw Error(`unexpected response ${response.statusText}, status code ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      throw `Petcare | reset feeder with ID ${deviceId} failed: ${err}`;
    }
  }

  async getTimeline(householdId, options = {}) {
    try {
      let since = options.sinceId ? `?since_id=${options.sinceId}&page_size=1000` : '';
      let before = options.beforeId ? `?before_id=${options.beforeId}` : '';
      if(since && before) throw Error(`can't get before AND since option on timline`)
      let option = options.opt ? `/${options.opt}` : '';
      const response = await fetch(
        `${baseURL}/timeline/household/${householdId}${option}${since}${before}`,
        {
          headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
            authorization: `Bearer ${this.#token}`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sec-gpc": "1",
            "x-app-version": "browser",
            "x-device-id": "7c02b43db7",
          },
          referrer: "https://www.surepetcare.io/",
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "GET",
          mode: "cors",
          credentials: "include",
        }
      );
      if (!response.ok) throw Error(`unexpected response ${response.statusText}, status code ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      throw `Petcare | GET more timeline failed: ${err}`;
    }
  }

  async setPetPlace(petID, whereBit) {
    try {
      const response = await fetch(`${baseURL}/pet/${petID}/position`, {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          authorization: `Bearer ${this.#token}`,
          "content-type": "application/json",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "sec-gpc": "1",
          "x-app-version": "browser",
          "x-device-id": "81df2ec2b5",
        },
        referrer: "https://www.surepetcare.io/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `{\"where\":${whereBit},\"since\":\"${new Date()
          .toISOString()
          .replace("T", " ")
          .slice(0, -5)}\"}`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      if (!response.ok) throw Error(`unexpected response ${response.statusText}, status code ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      throw `Petcare | set Pet with ID ${petID} to ${whereBit} failed: ${err}`;
    }
  }
}

module.exports = PetCareAPI;
