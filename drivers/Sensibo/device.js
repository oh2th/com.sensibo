'use strict';

const Homey = require('homey');
const Sensibo = require('../../lib/sensibo');

module.exports = class SensiboDevice extends Homey.Device {

  onInit() {
    this.log('virtual device initialized');

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

    this.registerCapabilityListener('se_onoff', async (value, opts) => {
      return value ? this.onActionTurnOn({ device: this }) : this.onActionTurnOff({ device: this });
    });

    this.scheduleCheckData(2);
  }

  onAdded() {
    this.log('virtual device added:', this.getData().id);
  }

  onDeleted() {
    this.log('virtual device deleted');
  }

  async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
    if (changedKeysArr.includes('Polling_Interval')) {
      this.scheduleCheckData();
    }

    callback(null, true);
  }

  async checkData() {
    try {
      this.clearCheckData();
      this.log(`Fetching AC state for: ${this._sensibo.getDeviceId()}`);
      let data = await this._sensibo.getSpecificDeviceInfo();
      await this.onDeviceInfoReceived(data);
    } catch (err) {
      this.log('checkData error');
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
      if (this.hasCapability('se_fanlevel')) {
        await this.updateIfChanged('se_fanlevel', result.acState.fanLevel);
      }
      if (this.hasCapability('thermostat_mode')) {
        let thermostat_mode = result.acState.on === false ? 'off' :
          (result.acState.mode === 'heat' || result.acState.mode === 'cool' || result.acState.mode === 'auto' ? result.acState.mode : undefined);
        if (thermostat_mode) {
          await this.updateIfChanged('thermostat_mode', thermostat_mode);
        }
      }
      await this.updateIfChanged('measure_temperature', result.measurements.temperature);
      await this.updateIfChanged('measure_humidity', result.measurements.humidity);
    }
  }

  async updateIfChanged(cap, toValue) {
    let capValue = this.getCapabilityValue(cap);
    if (capValue !== toValue || capValue === undefined || capValue === null) {
      await this.setCapabilityValue(cap, toValue).catch(console.error);
      return true;
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
    this.clearCheckData();
    let interval = seconds;
    if (!interval) {
      let settings = await this.getSettings();
      interval = settings.Polling_Interval || 30;
    }
    this.curTimeout = setTimeout(this.checkData.bind(this), interval * 1000);
  }

  async onActionTurnOn() {
    try {
      this.clearCheckData();
      this.log(`turn on: ${this._sensibo.getDeviceId()}`);
      await this._sensibo.setAcState({ on: true });
      await this.setCapabilityValue('se_onoff', true).catch(console.error);
      let mode = this._sensibo.getAcState()['mode'];
      mode = (mode !== 'heat' && mode !== 'cool' && mode !== 'auto') ? 'auto' : mode;
      if (this.hasCapability('thermostat_mode')) {
        await this.setCapabilityValue('thermostat_mode', mode).catch(console.error);
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
      await this.setCapabilityValue('se_onoff', false).catch(console.error);
      if (this.hasCapability('thermostat_mode')) {
        await this.setCapabilityValue('thermostat_mode', 'off').catch(console.error);
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
      this.log(`set fan mode: ${this._sensibo.getDeviceId()} -> ${mode}`);
      await this._sensibo.setAcState({ mode: mode });
      this.log(`set fan mode OK: ${this._sensibo.getDeviceId()} -> ${mode}`);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onActionSetFanLevel(fanLevel) {
    await this.onUpdateFanlevel(fanLevel);
    if (this.hasCapability('se_fanlevel')) {
      await this.setCapabilityValue('se_fanlevel', fanLevel).catch(console.error);
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
      this.log(`set thermostat mode: ${this._sensibo.getDeviceId()} -> ${value}`);
      if (value === 'off') {
        await this._sensibo.setAcState({ on: false });
        await this.setCapabilityValue('se_onoff', false).catch(console.error);
        Homey.app._turnedOffTrigger.trigger(this, { state: 0 }, {});
      } else {
        await this._sensibo.setAcState({ on: true, mode: value });
        await this.setCapabilityValue('se_onoff', true).catch(console.error);
        Homey.app._turnedOnTrigger.trigger(this, { state: 1 }, {});
      }
      this.log(`set thermostat OK: ${this._sensibo.getDeviceId()} -> ${value}`);
    } finally {
      this.scheduleCheckData();
    }
  }

  async onUpdateFanlevel(value, opts) {
    try {
      this.clearCheckData();
      this.log(`set fan level: ${this._sensibo.getDeviceId()} -> ${value}`);
      await this._sensibo.setAcState({ fanLevel: value });
      this.log(`set fan level OK: ${this._sensibo.getDeviceId()} -> ${value}`);
    } finally {
      this.scheduleCheckData();
    }
  }

};
