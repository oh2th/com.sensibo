'use strict';

const http = require('http.min');
const util = require('./util');

module.exports = class Sensibo {

  constructor(options) {
    if (options == null) {
      options = {}
    }
    this._homey = options.Homey;
    this._deviceId = options.deviceId;
    this._logger = options.logger;
    this._acState = {
      on: true,
      mode: 'heat',
      fanLevel: 'auto',
      targetTemperature: 21,
      temperatureUnit: 'C',
      swing: 'rangeFull'
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

  hasApiKey() {
    return this.getApiKey() !== undefined &&
      this.getApiKey() !== null &&
      this.getApiKey().length > 0;
  }

  getApiKey() {
    return this._homey && this._homey.ManagerSettings ? this._homey.ManagerSettings.get('apikey') : undefined;
  }

  getAllDevicesUri() {
    return `${this.getUri()}/users/me/pods?fields=id,room&apiKey=${this.getApiKey()}`;
  }

  async getAllDevices() {
    return http({ uri: this.getAllDevicesUri(), json: true });
  }

  getRemoteCapabilities() {
    return http({
      uri: `${this.getUri()}/pods/${this.getDeviceId()}?fields=remoteCapabilities&apiKey=${this.getApiKey()}`,
      json: true
    });
  }

  getSpecificDeviceInfoUri() {
    return `${this.getUri()}/pods/${this.getDeviceId()}?fields=measurements,acState,timer&apiKey=${this.getApiKey()}`;
  }

  async getSpecificDeviceInfo() {
    return http({ uri: this.getSpecificDeviceInfoUri(), json: true });
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

  checkMode(mode, throwException = true) {
    const modes = this.getModes();
    if (modes && !modes.includes(mode)) {
      this._logger(`checkMode: invalid mode: ${mode}`);
      if (throwException) {
        throw new Error(`The selected mode (${mode}) is not supported`);
      }
      return false;
    }
    return true;
  }

  getFanLevels(mode) {
    return util.getFanLevels(this._remoteCapabilities, mode);
  }

  getAllFanLevels() {
    return util.getAllFanLevels(this._remoteCapabilities);
  }

  checkFanLevel(fanLevel, throwException = true) {
    const fanLevels = this.getFanLevels(this._acState.mode);
    if (fanLevels && !fanLevels.includes(fanLevel)) {
      this._logger(`checkFanLevel: invalid fan level: ${fanLevel}`);
      if (throwException) {
        throw new Error(`The selected fan level (${fanLevel}) is not supported`);
      }
      return false;
    }
    return true;
  }

  getSwings(mode) {
    return mode && this._remoteCapabilities && this._remoteCapabilities.modes[mode] ?
      this._remoteCapabilities.modes[mode].swing : undefined;
  }

  checkSwingMode(swingMode) {
    const swings = this.getSwings(this._acState.mode);
    if (swings && !swings.includes(swingMode)) {
      this._logger(`checkSwingMode: invalid swing mode: ${swingMode}`);
      throw new Error(`The selected swing mode (${swingMode}) is not supported`);
    }
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
  }

  setAcStateUri() {
    return `${this.getUri()}/pods/${this.getDeviceId()}/acStates?apiKey=${this.getApiKey()}`;
  }

  async setAcState(acState) {
    this.updateAcState(acState);
    this._logger('setAcState', this.getDeviceId(), this._acState);
    let data = await http.post({
      uri: this.setAcStateUri(),
      json: true
    }, { acState: this._acState });
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