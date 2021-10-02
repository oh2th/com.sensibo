'use strict';

const BaseDevice = require('../../lib/BaseDevice');

module.exports = class SensiboDevice extends BaseDevice {

  async migrate() {
    try {
      if (!this.getStoreValue('apikey')) {
        const apikey = this.homey.settings.get('apikey');
        await this.setStoreValue('apikey', apikey);
        this.log('Copied the apikey to device store');
      }
    } catch (err) {
      this.log('Copying of the apikey failed', err);
    }

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
      if (!this.hasCapability('se_horizontal_swing')) {
        await this.addCapability('se_horizontal_swing');
      }
      this.log('Migration OK');
    } catch (err) {
      this.log('Migration failed', err);
    }
  }

  async registerCapabilityListeners() {
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
        return this.onUpdateSwing(value, opts);
      });
    }

    if (this.hasCapability('se_horizontal_swing')) {
      this.registerCapabilityListener('se_horizontal_swing', (value, opts) => {
        return this.onUpdateHorizontalSwing(value, opts);
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
  }

  deviceName = () => 'SensiboDevice';

};
