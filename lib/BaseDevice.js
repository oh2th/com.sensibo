'use strict';

const Homey = require('homey');
const Sensibo = require('./sensibo');
const util = require('./util');

module.exports = class BaseDevice extends Homey.Device {

  async onInit() {
    await this.migrate();
    await this.createSensiboApi(this.log);
    await this.registerCapabilityListeners();
    await this.fetchRemoteCapabilities();
    this.log(`${this.deviceName()} device initialized`);
    this._initialized = true;
    this.homey.app.scheduleCheckData(5);
  }

  async migrate() {
  }

  getApiKey() {
    return this.getStoreValue('apikey');
  }

  isInitialized() {
    return this._initialized;
  }

  async createSensiboApi(logger) {
    this._sensibo = new Sensibo({
      apikey: this.getApiKey(),
      deviceId: this.getData().id,
      logger: logger
    });
  }

  async registerCapabilityListeners() {
  }

  async fetchRemoteCapabilities() {
    try {
      let data = await this._sensibo.getRemoteCapabilities();
      if (data.data) {
        let result = data.data.result;
        this.log('fetchRemoteCapabilities', result.remoteCapabilities);
        this._sensibo._remoteCapabilities = result.remoteCapabilities;
        await this.onRemoteCapabilitiesReceived(result.remoteCapabilities);
      }
    } catch (err) {
      this.log('fetchRemoteCapabilities error', err);
    }
  }

  async onRemoteCapabilitiesReceived(remoteCaps) {
  }

  deviceName = () => {
    throw new Error('Not implemented');
  }

  onAdded() {
    this.homey.scheduleCheckData(5);
    this.log(`${this.deviceName()} added:`, this.getData().id);
  }

  onDeleted() {
    this._deleted = true;
    this.clearCheckData();
    this.clearTimer();
    this.log(`${this.deviceName()} deleted`);
  }

  async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
    if (changedKeysArr.includes('Polling_Interval')) {
      this.scheduleCheckData();
    }

    callback(null, true);
  }

  async onDeviceInfoReceived(result) {
    if (result) {
      this.log(`Device info for: ${this.getData().id}:`, result );
      if (result.acState) {
        this._sensibo.updateAcState(result.acState);
        if (await this.updateIfChanged('se_onoff', result.acState.on)) {
          if (result.acState.on) {
            this.homey.app._turnedOnTrigger.trigger(this, { state: 1 }, {});
          } else {
            this.homey.app._turnedOffTrigger.trigger(this, { state: 0 }, {});
          }
        }

        await this.updateIfChanged('target_temperature', result.acState.targetTemperature);
        await this.updateIfChanged('se_fanlevel', result.acState.fanLevel);
        await this.updateIfChanged('se_fanlevel_pure', result.acState.fanLevel);
        await this.updateIfChanged('se_fandirection', result.acState.swing);
        await this.updateIfChanged('se_horizontal_swing', result.acState.horizontalSwing);
        let thermostat_mode = result.acState.on === false ? 'off' :
          (result.acState.mode === 'heat' || result.acState.mode === 'cool' || result.acState.mode === 'auto' ? result.acState.mode : undefined);
        if (thermostat_mode) {
          await this.updateIfChanged('thermostat_mode', thermostat_mode);
        }
      }
      if (result.timer && result.timer.isEnabled && result.timer.targetTimeSecondsFromNow >= 0) {
        this.scheduleTimer(result.timer.targetTimeSecondsFromNow);
      } else {
        this.clearTimer();
      }
      const hasTimer = !!result.timer;
      const hasTimerEnabled = !!(result.timer && result.timer.isEnabled);
      if (this._hasTimerEnabled === false && hasTimerEnabled === true) {
        this.homey.app._timerCreatedTrigger.trigger(this, { homey: false }, {});
      } else if (this._hasTimer === true && hasTimer === false) {
        this.homey.app._timerDeletedTrigger.trigger(this, { homey: false }, {});
      }
      this._hasTimer = hasTimer;
      this._hasTimerEnabled = hasTimerEnabled;
      if (result.measurements) {
        await this.updateIfChanged('measure_temperature', result.measurements.temperature);
        await this.updateIfChanged('measure_humidity', result.measurements.humidity);
        if (result.measurements.pm25) {
          const airQuality = util.AIR_QUALITIES[result.measurements.pm25];
          if (airQuality) {
            await this.updateIfChanged('air_quality', airQuality);
          }
        }
        if (result.measurements.time) {
          const secondsAgo = result.measurements.time.secondsAgo;
          const lastSeen = new Date(result.measurements.time.time).toTimeString().substr(0, 8);

          await this.updateIfChanged('se_last_seen_seconds', secondsAgo);
          await this.updateIfChanged('se_last_seen', lastSeen);

          let settings = await this.getSettings();
          const limitOffline = settings.Delay_Offline || 300;

          if (secondsAgo > limitOffline && !this._offlineTrigged) {
            this.homey.app._offlineTrigger.trigger(this, {
              seconds_ago: secondsAgo,
              last_seen: lastSeen
            }, {});
            this._offlineTrigged = true;
          } else {
            this._offlineTrigged = false;
          }
        }
      }
    }
  }

  async updateIfChanged(cap, toValue) {
    if (this.hasCapability(cap) && toValue !== undefined) {
      let capValue = this.getCapabilityValue(cap);
      if (capValue !== toValue || capValue === undefined || capValue === null) {
        await this.setCapabilityValue(cap, toValue).catch(err => this.log(err));
        return true;
      }
    }
    return false;
  }

  clearCheckData() {
    if (this.curTimeout) {
      clearTimeout(this.curTimeout);
      this.curTimeout = undefined;
    }
  }

  async scheduleCheckData(seconds) {
    if (this._deleted) {
      return;
    }
    this.clearCheckData();
    let interval = seconds;
    if (!interval) {
      let settings = await this.getSettings();
      interval = settings.Polling_Interval || 30;
    }
    this.curTimeout = this.homey.setTimeout(this.checkData.bind(this), interval * 1000);
  }

  async checkData() {
  }

  clearTimer() {
    if (this.curTimer) {
      clearTimeout(this.curTimer);
      this.curTimer = undefined;
    }
  }

  async scheduleTimer(seconds) {
    if (this._deleted) {
      return;
    }
    this.clearTimer();
    this.curTimer = this.homey.setTimeout(this.onTimerFired.bind(this), seconds * 1000 + 1);
  }

  async onTimerFired() {
    if (this._deleted) {
      return;
    }
    try {
      this.clearTimer();
      this.homey.app._timerFiredTrigger.trigger(this, { state: 1 }, {});
      this.log(`Timer fired for: ${this._sensibo.getDeviceId()}`);
    } catch (err) {
      this.log('onTimerFired error', err);
    }
  }

  async onActionTurnOn() {
    try {
      this.clearCheckData();
      this.log(`turn on: ${this._sensibo.getDeviceId()}`);
      await this._sensibo.setAcState({ on: true });
      await this.setCapabilityValue('se_onoff', true).catch(err => this.log(err));
      if (this.hasCapability('thermostat_mode')) {
        let mode = this._sensibo.getAcState()['mode'];
        mode = (mode !== 'heat' && mode !== 'cool' && mode !== 'auto') ? 'auto' : mode;
        await this.setCapabilityValue('thermostat_mode', mode).catch(err => this.log(err));
      }
      this.homey.app._turnedOnTrigger.trigger(this, { state: 1 }, {});
      this.log(`turned on OK: ${this._sensibo.getDeviceId()}`);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onActionTurnOff() {
    try {
      this.clearCheckData();
      this.log(`turn off: ${this._sensibo.getDeviceId()}`);
      await this._sensibo.setAcState({ on: false });
      await this.setCapabilityValue('se_onoff', false).catch(err => this.log(err));
      if (this.hasCapability('thermostat_mode')) {
        await this.setCapabilityValue('thermostat_mode', 'off').catch(err => this.log(err));
      }
      this.homey.app._turnedOffTrigger.trigger(this, { state: 0 }, {});
      this.log(`turned off OK: ${this._sensibo.getDeviceId()}`);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onActionSetMode(mode) {
    try {
      this.clearCheckData();
      if (this._sensibo.checkMode(mode)) {
        this.log(`set fan mode: ${this._sensibo.getDeviceId()} -> ${mode}`);
        await this._sensibo.setAcState({ mode: mode });
        this.log(`set fan mode OK: ${this._sensibo.getDeviceId()} -> ${mode}`);
      }
    } finally {
      this.scheduleCheckData();
    }
  }

  async onModeAutocomplete(query, args) {
    const modes = this._sensibo.getModes() || ['cool', 'heat', 'fan', 'auto', 'dry'];
    return Promise.resolve((modes).map(mode => {
      return {
        id: mode,
        name: mode[0].toUpperCase() + mode.substr(1).toLowerCase()
      };
    }).filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    }));
  }

  async onActionSetFanLevel(fanLevel) {
    await this.onUpdateFanlevel(fanLevel);
    if (this.hasCapability('se_fanlevel')) {
      await this.setCapabilityValue('se_fanlevel', fanLevel).catch(err => this.log(err));
    }
  }

  async onFanLevelAutocomplete(query, args) {
    const fanLevels = this._sensibo.getAllFanLevels() || ['auto', 'high', 'medium', 'low'];
    return Promise.resolve((fanLevels).map(fanLevel => {
      let name = fanLevel[0].toUpperCase() + fanLevel.substr(1).toLowerCase();
      name = name.replace('_', ' ');
      return {
        id: fanLevel,
        name: name
      };
    }).filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    }));
  }

  async onActionSetSwing(swing) {
    await this.onUpdateSwing(swing);
    if (this.hasCapability('se_fandirection')) {
      await this.setCapabilityValue('se_fandirection', swing).catch(err => this.log(err));
    }
  }

  async onSwingAutocomplete(query, args) {
    const items = this._sensibo.getAllSwings() || ['stopped', 'fixedBottom', 'fixedTop', 'rangeTop', 'rangeFull'];
    return Promise.resolve((items).map(item => {
      let name = item[0].toUpperCase() + item.substr(1).toLowerCase();
      name = name.replace('_', ' ');
      return {
        id: item,
        name: name
      };
    }).filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    }));
  }

  async onActionSetHorizontalSwing(horizontalSwing) {
    await this.onUpdateHorizontalSwing(horizontalSwing);
    if (this.hasCapability('se_horizontal_swing')) {
      await this.setCapabilityValue('se_horizontal_swing', horizontalSwing).catch(err => this.log(err));
    }
  }

  async onHorizontalSwingAutocomplete(query, args) {
    const items = this._sensibo.getAllHorizontalSwings() || ['stopped', 'fixedLeft', 'fixedRight', 'rangeCenter', 'rangeFull'];
    return Promise.resolve((items).map(item => {
      let name = item[0].toUpperCase() + item.substr(1).toLowerCase();
      name = name.replace('_', ' ');
      return {
        id: item,
        name: name
      };
    }).filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    }));
  }

  async onActionClimateReact(enabled) {
    await this.onUpdateClimateReact(enabled);
    if (this.hasCapability('se_climate_react')) {
      await this.setCapabilityValue('se_climate_react', enabled).catch(err => this.log(err));
    }
  }

  async onActionPureBoost(enabled) {
    await this.onUpdatePureBoost(enabled);
  }

  async isTimerEnabled() {
    return this._sensibo.isTimerEnabled();
  }

  async onDeleteTimer() {
    try {
      this.clearCheckData();
      await this._sensibo.deleteCurrentTimer();
      this._hasTimer = false;
      this._hasTimerEnabled = false;
      this.homey.app._timerDeletedTrigger.trigger(this, { homey: true }, {});
    } catch (err) {
      this.log('onDeleteTimer error', err);
      throw err;
    } finally {
      this.scheduleCheckData();
    }
  }

  async onSetTimer(minutesFromNow, on, mode, fanLevel, targetTemperature) {
    try {
      this.log('onSetTimer', minutesFromNow, on, on === 'on', mode, fanLevel, targetTemperature);
      this.clearCheckData();
      const newAcState = {
        on: on !== 'nop' ? on === 'on' : undefined,
        mode: mode !== 'nop' ? mode : undefined,
        fanLevel: fanLevel !== 'nop' ? fanLevel : undefined,
        targetTemperature: targetTemperature >= 10 ? targetTemperature : undefined,
      };
      if (minutesFromNow <= 0) {
        throw new Error('Minutes from now must be specified.');
      }
      if (minutesFromNow > 1440) {
        throw new Error('Minutes from now cannot be larger than 1440.');
      }
      if (newAcState.on === undefined &&
        newAcState.mode === undefined &&
        newAcState.fanLevel === undefined &&
        newAcState.targetTemperature === undefined) {
        throw new Error('At least one parameter must be specified.');
      }
      await this._sensibo.setCurrentTimer(minutesFromNow, newAcState);
      this._hasTimer = true;
      this._hasTimerEnabled = true;
      this.homey.app._timerCreatedTrigger.trigger(this, { homey: true }, {});
    } catch (err) {
      this.log('onSetTimer error', err);
      throw err;
    } finally {
      this.scheduleCheckData();
    }
  }


  async onControlLight(state) {
    try {
      this.clearCheckData();
      this.log(`set light: ${this._sensibo.getDeviceId()} -> ${state}`);
      await this._sensibo.setAcState({ light: state });
      this.log(`set light OK: ${this._sensibo.getDeviceId()} -> ${state}`);
    } catch (err) {
      this.log('onControlLight error', err);
      throw err;
    } finally {
      this.scheduleCheckData();
    }
  }

  async onSyncPowerState(state) {
    try {
      this.clearCheckData();
      this.log('onSyncPowerState', state);
      await this._sensibo.syncDeviceState(state === 'on');
    } catch (err) {
      this.log('onSyncPowerState error', err);
      throw err;
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateTargetTemperature(value, opts) {
    try {
      this.clearCheckData();
      this.log(`set target temperature: ${this._sensibo.getDeviceId()} -> ${value}`);
      await this._sensibo.setAcState({ targetTemperature: value });
      this.log(`set target temperature OK: ${this._sensibo.getDeviceId()} -> ${value}`);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateThermostatMode(value, opts) {
    try {
      this.clearCheckData();
      if (value === 'off' || this._sensibo.checkMode(value)) {
        this.log(`set thermostat mode: ${this._sensibo.getDeviceId()} -> ${value}`);
        if (value === 'off') {
          await this._sensibo.setAcState({ on: false });
          await this.setCapabilityValue('se_onoff', false).catch(err => this.log(err));
          this.homey.app._turnedOffTrigger.trigger(this, { state: 0 }, {});
        } else {
          await this._sensibo.setAcState({ on: true, mode: value });
          await this.setCapabilityValue('se_onoff', true).catch(err => this.log(err));
          this.homey.app._turnedOnTrigger.trigger(this, { state: 1 }, {});
        }
        this.log(`set thermostat OK: ${this._sensibo.getDeviceId()} -> ${value}`);
      }
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateFanlevel(value, opts) {
    try {
      this.clearCheckData();
      if (this._sensibo.checkFanLevel(value)) {
        this.log(`set fan level: ${this._sensibo.getDeviceId()} -> ${value}`);
        await this._sensibo.setAcState({ fanLevel: value });
        this.log(`set fan level OK: ${this._sensibo.getDeviceId()} -> ${value}`);
      }
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateSwing(value, opts) {
    try {
      this.clearCheckData();
      if (this._sensibo.checkSwingMode(value)) {
        this.log(`set swing: ${this._sensibo.getDeviceId()} -> ${value}`);
        await this._sensibo.setAcState({ swing: value });
        this.log(`set swing OK: ${this._sensibo.getDeviceId()} -> ${value}`);
      }
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateHorizontalSwing(value, opts) {
    try {
      this.clearCheckData();
      if (this._sensibo.checkHorizontalSwingMode(value)) {
        this.log(`set horizontal swing: ${this._sensibo.getDeviceId()} -> ${value}`);
        await this._sensibo.setAcState({ horizontalSwing: value });
        this.log(`set horizontal swing OK: ${this._sensibo.getDeviceId()} -> ${value}`);
      }
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateClimateReact(value, opts) {
    try {
      this.clearCheckData();
      this.log(`enable/disable Climate React: ${this._sensibo.getDeviceId()} -> ${value}`);
      await this._sensibo.enableClimateReact(value === 'on');
      this.log(`enable/disable Climate React OK: ${this._sensibo.getDeviceId()} -> ${value}`);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdatePureBoost(value, opts) {
    try {
      this.clearCheckData();
      this.log(`enable/disable Pure Boost: ${this._sensibo.getDeviceId()} -> ${value}`);
      await this._sensibo.enablePureBoost(value === 'on');
      this.log(`enable/disable Pure Boost OK: ${this._sensibo.getDeviceId()} -> ${value}`);
    } finally {
      this.scheduleCheckData();
    }
  }

};
