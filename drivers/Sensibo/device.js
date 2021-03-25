'use strict';

const Homey = require('homey');
const Sensibo = require('../../lib/sensibo');

module.exports = class SensiboDevice extends Homey.Device {

  async onInit() {
    this.log('virtual device initialized');

    try {
      if (!this.hasCapability('se_fanlevel')) {
        await this.addCapability('se_fanlevel');
      }
      if (!this.hasCapability('se_fandirection')) {
        await this.addCapability('se_fandirection');
      }
      if (!this.hasCapability('se_last_seen')) {
        await this.addCapability('se_last_seen');
      }
      if (!this.hasCapability('se_last_seen_seconds')) {
        await this.addCapability('se_last_seen_seconds');
      }
      if (!this.hasCapability('se_climate_react')) {
        await this.addCapability('se_climate_react');
      }
    } catch (err) {
      this.log('migration failed', err);
    }

    this._sensibo = new Sensibo({
      Homey: Homey,
      deviceId: this.getData().id,
      logger: this.log
    });

    this.registerCapabilityListener('target_temperature', (value, opts) => {
      return this.onUpdateTargetTemperature(value, opts);
    });

    if (this.hasCapability('thermostat_mode')) {
      this.registerCapabilityListener('thermostat_mode', (value, opts) => {
        return this.onUpdateThermostatMode(value, opts);
      });
    }

    if (this.hasCapability('se_fanlevel')) {
      this.registerCapabilityListener('se_fanlevel', (value, opts) => {
        return this.onUpdateFanlevel(value, opts);
      });
    }

    if (this.hasCapability('se_fandirection')) {
      this.registerCapabilityListener('se_fandirection', (value, opts) => {
        return this.onUpdateFanDirection(value, opts);
      });
    }

    if (this.hasCapability('se_climate_react')) {
      this.registerCapabilityListener('se_climate_react', (value, opts) => {
        return this.onUpdateClimateReact(value, opts);
      });
    }

    this.registerCapabilityListener('se_onoff', async (value, opts) => {
      return value ? this.onActionTurnOn({ device: this }) : this.onActionTurnOff({ device: this });
    });

    await this.fetchRemoteCapabilities();
    await this.scheduleCheckData(2);
  }

  onAdded() {
    this.log('device added:', this.getData().id);
  }

  onDeleted() {
    this._deleted = true;
    this.clearCheckData();
    this.clearTimer();
    this.log('device deleted');
  }

  async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
    if (changedKeysArr.includes('Polling_Interval')) {
      this.scheduleCheckData();
    }

    callback(null, true);
  }

  async fetchRemoteCapabilities() {
    try {
      let data = await this._sensibo.getRemoteCapabilities();
      if (data.data) {
        let result = data.data.result;
        this._sensibo._remoteCapabilities = result.remoteCapabilities;
        this.log('fetchRemoteCapabilities', this._sensibo._remoteCapabilities);
      }
    } catch (err) {
      this.log('fetchRemoteCapabilities error', err);
    }
  }

  async checkData() {
    if (this._deleted) {
      return;
    }
    try {
      this.clearCheckData();
      this.log(`Fetching AC state for: ${this._sensibo.getDeviceId()}`);
      let data = await this._sensibo.getSpecificDeviceInfo();
      await this.onDeviceInfoReceived(data);
      let acStatesData = await this._sensibo.getAcStates();
      await this.onAcStatesReceived(acStatesData);
      if (this.hasCapability('se_climate_react')) {
        let climateReactSettings = await this._sensibo.getClimateReactSettings();
        await this.onClimateReactSettingsReceived(climateReactSettings);
      }
    } catch (err) {
      this.log('checkData error', err);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onDeviceInfoReceived(data) {
    this.log(`AC state for: ${this._sensibo.getDeviceId()}`, data.data);
    if (data.data) {
      let result = data.data.result;
      this._sensibo.updateAcState(result.acState);
      if (await this.updateIfChanged('se_onoff', result.acState.on)) {
        if (result.acState.on) {
          Homey.app._turnedOnTrigger.trigger(this, { state: 1 }, {});
        } else {
          Homey.app._turnedOffTrigger.trigger(this, { state: 0 }, {});
        }
      }
      await this.updateIfChanged('target_temperature', result.acState.targetTemperature);
      await this.updateIfChanged('se_fanlevel', result.acState.fanLevel);
      await this.updateIfChanged('se_fandirection', result.acState.swing);
      let thermostat_mode = result.acState.on === false ? 'off' :
        (result.acState.mode === 'heat' || result.acState.mode === 'cool' || result.acState.mode === 'auto' ? result.acState.mode : undefined);
      if (thermostat_mode) {
        await this.updateIfChanged('thermostat_mode', thermostat_mode);
      }
      await this.updateIfChanged('measure_temperature', result.measurements.temperature);
      await this.updateIfChanged('measure_humidity', result.measurements.humidity);
      if (result.timer && result.timer.isEnabled && result.timer.targetTimeSecondsFromNow >= 0) {
        this.scheduleTimer(result.timer.targetTimeSecondsFromNow);
      } else {
        this.clearTimer();
      }
      const hasTimer = !!result.timer;
      const hasTimerEnabled = !!(result.timer && result.timer.isEnabled);
      if (this._hasTimerEnabled === false && hasTimerEnabled === true) {
        Homey.app._timerCreatedTrigger.trigger(this, { homey: false }, {});
      } else if (this._hasTimer === true && hasTimer === false) {
        Homey.app._timerDeletedTrigger.trigger(this, { homey: false }, {});
      }
      this._hasTimer = hasTimer;
      this._hasTimerEnabled = hasTimerEnabled;
      if (result.measurements.time) {
        const secondsAgo = result.measurements.time.secondsAgo;
        const lastSeen = new Date(result.measurements.time.time).toTimeString().substr(0, 8);

        await this.updateIfChanged('se_last_seen_seconds', secondsAgo);
        await this.updateIfChanged('se_last_seen', lastSeen);

        let settings = await this.getSettings();
        const limitOffline = settings.Delay_Offline || 300;

        if (secondsAgo > limitOffline && !this._offlineTrigged) {
          Homey.app._offlineTrigger.trigger(this, {
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

  async onAcStatesReceived(data) {
    if (data.data) {
      let curAcStates = data.data.result;
      this.log(`AC States for: ${this._sensibo.getDeviceId()}`, curAcStates.length, curAcStates.map(acs => acs.id));
      if (this._lastAcStatesIds) {
        for (let anAcState of curAcStates) {
          if (this._lastAcStatesIds[anAcState.id]) {
            break;
          }
          const payload = {
            status: anAcState.status,
            reason: anAcState.reason,
            on: anAcState.acState.on,
            fanLevel: anAcState.acState.fanLevel ? anAcState.acState.fanLevel : '',
            targetTemperature: anAcState.acState.targetTemperature,
            mode: anAcState.acState.mode ? anAcState.acState.mode : '',
            swing: anAcState.acState.swing ? anAcState.acState.swing : '',
            failureReason: anAcState.failureReason ? anAcState.failureReason : '',
          };
          Homey.app._acStateChangedTrigger.trigger(this, payload, {});
          this.log(`AC State change triggered: ${this._sensibo.getDeviceId()}`, anAcState.id, payload);
        }
      }
      this._lastAcStatesIds = curAcStates.reduce(function (map, obj) {
        map[obj.id] = obj.id;
        return map;
      }, {});
    }
  }

  async onClimateReactSettingsReceived(data) {
    if (data.data) {
      let result = data.data.result;
      this.log(`Climate React settings for: ${this._sensibo.getDeviceId()}: enabled: ${result.enabled}`);
      await this.updateIfChanged('se_climate_react', result.enabled ? 'on' : 'off');
      if (this._lastClimateReact !== undefined && this._lastClimateReact !== result.enabled) {
        Homey.app._climateReactChangedTrigger.trigger(this, {
          climate_react_enabled: result.enabled,
          climate_react: result.enabled ? 'enabled' : 'disabled',
        }, {});
      }
      this._lastClimateReact = result.enabled;
    }
  }

  async updateIfChanged(cap, toValue) {
    if (this.hasCapability(cap)) {
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
    this.curTimeout = setTimeout(this.checkData.bind(this), interval * 1000);
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
    this.curTimer = setTimeout(this.onTimerFired.bind(this), seconds * 1000 + 1);
  }

  async onTimerFired() {
    if (this._deleted) {
      return;
    }
    try {
      this.clearTimer();
      Homey.app._timerFiredTrigger.trigger(this, { state: 1 }, {});
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
      let mode = this._sensibo.getAcState()['mode'];
      mode = (mode !== 'heat' && mode !== 'cool' && mode !== 'auto') ? 'auto' : mode;
      if (this.hasCapability('thermostat_mode')) {
        await this.setCapabilityValue('thermostat_mode', mode).catch(err => this.log(err));
      }
      Homey.app._turnedOnTrigger.trigger(this, { state: 1 }, {});
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
      Homey.app._turnedOffTrigger.trigger(this, { state: 0 }, {});
      this.log(`turned off OK: ${this._sensibo.getDeviceId()}`);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onActionSetMode(mode) {
    try {
      this.clearCheckData();
      if (this._sensibo.checkMode(mode, false)) {
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

  async onActionSetFanDirection(fanDirection) {
    await this.onUpdateFanDirection(fanDirection);
    if (this.hasCapability('se_fandirection')) {
      await this.setCapabilityValue('se_fandirection', fanDirection).catch(err => this.log(err));
    }
  }

  async onActionClimateReact(enabled) {
    await this.onUpdateClimateReact(enabled);
    if (this.hasCapability('se_climate_react')) {
      await this.setCapabilityValue('se_climate_react', enabled).catch(err => this.log(err));
    }
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
      Homey.app._timerDeletedTrigger.trigger(this, { homey: true }, {});
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
        targetTemperature: targetTemperature >= 16 or targetTemperature == 10 ? targetTemperature : undefined,
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
      Homey.app._timerCreatedTrigger.trigger(this, { homey: true }, {});
    } catch (err) {
      this.log('onSetTimer error', err);
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
      if (value === 'off' || this._sensibo.checkMode(value, false)) {
        this.log(`set thermostat mode: ${this._sensibo.getDeviceId()} -> ${value}`);
        if (value === 'off') {
          await this._sensibo.setAcState({ on: false });
          await this.setCapabilityValue('se_onoff', false).catch(err => this.log(err));
          Homey.app._turnedOffTrigger.trigger(this, { state: 0 }, {});
        } else {
          await this._sensibo.setAcState({ on: true, mode: value });
          await this.setCapabilityValue('se_onoff', true).catch(err => this.log(err));
          Homey.app._turnedOnTrigger.trigger(this, { state: 1 }, {});
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
      if (this._sensibo.checkFanLevel(value, false)) {
        this.log(`set fan level: ${this._sensibo.getDeviceId()} -> ${value}`);
        await this._sensibo.setAcState({ fanLevel: value });
        this.log(`set fan level OK: ${this._sensibo.getDeviceId()} -> ${value}`);
      }
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateFanDirection(value, opts) {
    try {
      this.clearCheckData();
      this._sensibo.checkSwingMode(value);
      this.log(`set fan direction: ${this._sensibo.getDeviceId()} -> ${value}`);
      await this._sensibo.setAcState({ swing: value });
      this.log(`set fan direction OK: ${this._sensibo.getDeviceId()} -> ${value}`);
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

};
