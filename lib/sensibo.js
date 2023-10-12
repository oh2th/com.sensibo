'use strict';

const http = require('http.min');
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
    return http({
      uri: `${this.getUri()}/users/me/pods?fields=id,room,productModel,motionSensors&apiKey=${this.getApiKey()}`,
      json: true
    });
  }

  async getAllDeviceInfo(apiKey) {
    return http({
      uri: `${this.getUri()}/users/me/pods?fields=id,room,productModel,acState,measurements,motionSensors,timer,connectionStatus,filtersCleaning&apiKey=${apiKey}`,
      json: true
    });
  }

  getRemoteCapabilities() {
    return http({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}?fields=measurements,remoteCapabilities,filtersCleaning&apiKey=${this.getApiKey()}`,
      json: true
    });
  }

  async getSpecificDeviceInfo() {
    return http({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}?fields=measurements,acState,timer,filtersCleaning&apiKey=${this.getApiKey()}`,
      json: true
    });
  }

  getAcStates() {
    return http({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/acStates?limit=10&apiKey=${this.getApiKey()}`,
      json: true
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
    let data = await http.post({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/acStates?apiKey=${this.getApiKey()}`,
      json: true
    }, {
      acState: this._acState
    });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error setting AC state (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    return data;
  }

  async setAcProperty(property, value) {
    this.updateAcState({
      [property]: value
    });
    this._logger('setAcProperty', this.getDeviceId(), property, value);
    let data = await http.patch({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/acStates/${property}?apiKey=${this.getApiKey()}`,
      json: true
    }, {
      newValue: value
    });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error setting AC property (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    return data;
  }

  async syncDeviceState(value) {
    this.updateAcState({
      on: value
    });
    let data = await http.patch({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/acStates/on?apiKey=${this.getApiKey()}`,
      json: true
    }, {
      newValue: value,
      reason: 'StateCorrectionByUser'
    });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error setting AC state (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    return data;
  }

  async getClimateReactSettings() {
    return http({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/smartmode?apiKey=${this.getApiKey()}`,
      json: true
    });
  }

  async enableClimateReact(enabled) {
    this._logger('enableClimateReact', this.getDeviceId(), enabled);
    let data = await http.put({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/smartmode?apiKey=${this.getApiKey()}`,
      json: true
    }, { enabled: enabled });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error setting Climate React (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    return data;
  }

  async enablePureBoost(enabled) {
    this._logger('enablePureBoost', this.getDeviceId(), enabled);
    let data = await http.put({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/pureboost?apiKey=${this.getApiKey()}`,
      json: true
    }, { enabled: enabled });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error setting Pure Boost (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    return data;
  }

  async resetFilterIndicator() {
    this._logger('resetFilterIndicator', this.getDeviceId());
    let data = await http.delete({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}/cleanFiltersNotification?apiKey=${this.getApiKey()}`,
      json: true
    });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error resetting filter indicator (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    return data;
  }

  getCurrentTimer() {
    return http({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}?fields=timer&apiKey=${this.getApiKey()}`,
      json: true
    });
  }

  async isTimerEnabled() {
    const data = await this.getCurrentTimer();
    if (data.response.statusCode !== 200) {
      throw new Error(`Error getting timer data (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    let result = data.data.result;
    this._logger('isTimerEnabled', this.getDeviceId(), result.timer, !!(result.timer && result.timer.isEnabled));
    return !!(result.timer && result.timer.isEnabled);
  }

  async deleteCurrentTimer() {
    let data = await http.delete({
      uri: `${this.getUri(1)}/pods/${this.getDeviceId()}/timer/?apiKey=${this.getApiKey()}`
    });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error deleting timer (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    this._logger('deleteCurrentTimer', this.getDeviceId(), data.response.statusCode, data.response.statusMessage);
    return data;
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
    let data = await http.put({
      uri: `${this.getUri(1)}/pods/${this.getDeviceId()}/timer/?apiKey=${this.getApiKey()}`
    }, { minutesFromNow: minutesFromNow, acState: timerAcState });
    if (data.response.statusCode !== 200) {
      throw new Error(`Error setting timer (${data.response.statusCode} - ${data.response.statusMessage})`);
    }
    this._logger('setCurrentTimer', this.getDeviceId(), data.response.statusCode, data.response.statusMessage);
    return data;
  }

};