'use strict';

const axios = require('axios').create({
  headers: {
    'Accept-Encoding': 'gzip',
  },
});
const util = require('./util');

module.exports = class Sensibo {

  constructor(options) {
    if (options == null) {
      options = {};
    }
    this._apikey = options.apikey;
    this._deviceId = options.deviceId;
    this._logger = options.logger;
    this._acState = {
    };
  }

  getUri(version = 2) {
    return `https://home.sensibo.com/api/v${version}`;
  }

  getDeviceId() {
    return this._deviceId;
  }

  getAcState() {
    return this._acState;
  }

  getApiKey() {
    return this._apikey;
  }

  async getAllDevices() {
    return axios({
      method: 'get',
      url: `${this.getUri()}/users/me/pods?fields=id,room,productModel,motionSensors&apiKey=${this.getApiKey()}`,
      responseType: 'json',
    });
  }

  async getAllDeviceInfo(apiKey) {
    return axios({
      method: 'get',
      url: `${this.getUri()}/users/me/pods?fields=id,room,productModel,acState,measurements,motionSensors,timer,connectionStatus,filtersCleaning&apiKey=${apiKey}`,
      responseType: 'json',
    });
  }

  getRemoteCapabilities() {
    return axios({
      method: 'get',
      url: `${this.getUri()}/pods/${this.getDeviceId()}?fields=measurements,remoteCapabilities,filtersCleaning&apiKey=${this.getApiKey()}`,
      responseType: 'json',
    });
  }

  async getSpecificDeviceInfo() {
    return axios({
      method: 'get',
      url: `${this.getUri()}/pods/${this.getDeviceId()}?fields=measurements,acState,timer,filtersCleaning&apiKey=${this.getApiKey()}`,
      responseType: 'json',
    });
  }

  getAcStates() {
    return axios({
      method: 'get',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/acStates?limit=10&apiKey=${this.getApiKey()}`,
      responseType: 'json',
    });
  }

  getModes() {
    return util.getModes(this._remoteCapabilities);
  }

  checkMode(mode) {
    const modes = this.getModes();
    if (modes && !modes.includes(mode)) {
      this._logger(`checkMode: invalid mode: ${mode}`);
      return false;
    }
    return true;
  }

  getAllFanLevels() {
    return util.getAllFanLevels(this._remoteCapabilities);
  }

  getAllSwings() {
    return util.getAllSwings(this._remoteCapabilities);
  }

  getAllHorizontalSwings() {
    return util.getAllHorizontalSwings(this._remoteCapabilities);
  }

  getAllLights() {
    return util.getAllLights(this._remoteCapabilities);
  }

  checkFanLevel(fanLevel) {
    const fanLevels = util.getFanLevels(this._remoteCapabilities, this._acState.mode);
    if (fanLevels && !fanLevels.includes(fanLevel)) {
      this._logger(`checkFanLevel: invalid fan level: ${fanLevel}`);
      return false;
    }
    return true;
  }

  checkSwingMode(swingMode) {
    const swings = util.getSwings(this._remoteCapabilities, this._acState.mode);
    if (swings && !swings.includes(swingMode)) {
      this._logger(`checkSwingMode: invalid swing mode: ${swingMode}`);
      return false;
    }
    return true;
  }

  checkHorizontalSwingMode(swingMode) {
    const swings = util.getHorizontalSwings(this._remoteCapabilities, this._acState.mode);
    if (swings && !swings.includes(swingMode)) {
      this._logger(`checkHorizontalSwingMode: invalid horizontal swing mode: ${swingMode}`);
      return false;
    }
    return true;
  }

  updateAcState(acState) {
    if (acState.on !== undefined) {
      this._acState.on = acState.on;
    }
    if (acState.mode !== undefined) {
      this._acState.mode = acState.mode;
    }
    if (acState.fanLevel !== undefined) {
      this._acState.fanLevel = acState.fanLevel;
    }
    if (acState.targetTemperature !== undefined) {
      this._acState.targetTemperature = acState.targetTemperature;
    }
    if (acState.temperatureUnit !== undefined) {
      this._acState.temperatureUnit = acState.temperatureUnit;
    }
    if (acState.swing !== undefined) {
      this._acState.swing = acState.swing;
    }
    if (acState.horizontalSwing !== undefined) {
      this._acState.horizontalSwing = acState.horizontalSwing;
    }
    if (acState.light !== undefined) {
      this._acState.light = acState.light;
    }
  }

  async setAcState(acState) {
    this.updateAcState(acState);
    this._logger('setAcState', this.getDeviceId(), this._acState);
    const response = await axios({
      method: 'post',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/acStates?apiKey=${this.getApiKey()}`,
      responseType: 'json',
      data: {
        acState: this._acState,
      },
    });
    if (response.status !== 200) {
      throw new Error(`Error setting AC state (${response.status} - ${response.statusText})`);
    }
    return response.data;
  }

  async setAcProperty(property, value) {
    this.updateAcState({
      [property]: value,
    });
    this._logger('setAcProperty', this.getDeviceId(), property, value);
    const response = await axios({
      method: 'patch',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/acStates/${property}?apiKey=${this.getApiKey()}`,
      responseType: 'json',
      data: {
        newValue: value,
      },
    });
    if (response.status !== 200) {
      throw new Error(`Error setting AC property (${response.status} - ${response.statusText})`);
    }
    return response.data;
  }

  async syncDeviceState(value) {
    this.updateAcState({
      on: value,
    });
    const response = await axios({
      method: 'patch',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/acStates/on?apiKey=${this.getApiKey()}`,
      responseType: 'json',
      data: {
        newValue: value,
        reason: 'StateCorrectionByUser',
      },
    });
    if (response.status !== 200) {
      throw new Error(`Error setting AC state (${response.status} - ${response.statusText})`);
    }
    return response.data;
  }

  async getClimateReactSettings() {
    return axios({
      method: 'get',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/smartmode?apiKey=${this.getApiKey()}`,
      responseType: 'json',
    });
  }

  async enableClimateReact(enabled) {
    this._logger('enableClimateReact', this.getDeviceId(), enabled);
    const response = await axios({
      method: 'put',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/smartmode?apiKey=${this.getApiKey()}`,
      responseType: 'json',
    }, { enabled });
    if (response.status !== 200) {
      throw new Error(`Error setting Climate React (${response.status} - ${response.statusText})`);
    }
    return response.data;
  }

  async enablePureBoost(enabled) {
    this._logger('enablePureBoost', this.getDeviceId(), enabled);
    const response = await axios({
      method: 'put',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/pureboost?apiKey=${this.getApiKey()}`,
      responseType: 'json',
    }, { enabled });
    if (response.status !== 200) {
      throw new Error(`Error setting Pure Boost (${response.status} - ${response.statusText})`);
    }
    return response.data;
  }

  async resetFilterIndicator() {
    this._logger('resetFilterIndicator', this.getDeviceId());
    const response = await axios({
      method: 'delete',
      url: `${this.getUri()}/pods/${this.getDeviceId()}/cleanFiltersNotification?apiKey=${this.getApiKey()}`,
      responseType: 'json',
    });
    if (response.status !== 200) {
      throw new Error(`Error resetting filter indicator (${response.status} - ${response.statusText})`);
    }
    return response.data;
  }

  getCurrentTimer() {
    return axios({
      method: 'get',
      url: `${this.getUri()}/pods/${this.getDeviceId()}?fields=timer&apiKey=${this.getApiKey()}`,
      responseType: 'json',
    });
  }

  async isTimerEnabled() {
    const data = await this.getCurrentTimer();
    if (response.status !== 200) {
      throw new Error(`Error getting timer data (${response.status} - ${response.statusText})`);
    }
    const result = data.data.result;
    this._logger('isTimerEnabled', this.getDeviceId(), result.timer, !!(result.timer && result.timer.isEnabled));
    return !!(result.timer && result.timer.isEnabled);
  }

  async deleteCurrentTimer() {
    const response = await axios({
      method: 'delete',
      url: `${this.getUri(1)}/pods/${this.getDeviceId()}/timer/?apiKey=${this.getApiKey()}`,
    });
    if (response.status !== 200) {
      throw new Error(`Error deleting timer (${response.status} - ${response.statusText})`);
    }
    this._logger('deleteCurrentTimer', this.getDeviceId(), response.status, response.statusText);
    return response.data;
  }

  async setCurrentTimer(minutesFromNow, acState) {
    const timerAcState = {
      on: acState.on !== undefined ? acState.on : this._acState.on,
      mode: acState.mode || this._acState.mode,
      fanLevel: acState.fanLevel || this._acState.fanLevel,
      targetTemperature: acState.targetTemperature || this._acState.targetTemperature,
      temperatureUnit: this._acState.temperatureUnit,
      swing: this._acState.swing,
    };
    this._logger('setCurrentTimer', this.getDeviceId(), minutesFromNow, timerAcState);
    const response = await axios({
      method: 'put',
      url: `${this.getUri(1)}/pods/${this.getDeviceId()}/timer/?apiKey=${this.getApiKey()}`,
    }, { minutesFromNow, acState: timerAcState });
    if (response.status !== 200) {
      throw new Error(`Error setting timer (${response.status} - ${response.statusText})`);
    }
    this._logger('setCurrentTimer', this.getDeviceId(), response.status, response.statusText);
    return response.data;
  }

};
