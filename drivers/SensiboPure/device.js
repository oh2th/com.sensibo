'use strict';

const BaseDevice = require('../../lib/BaseDevice');

module.exports = class SensiboPureDevice extends BaseDevice {

  async migrate() {
    try {
      this.log('Migration OK');
    } catch (err) {
      this.log('Migration failed', err);
    }
  }

  async registerCapabilityListeners() {
    if (this.hasCapability('se_fanlevel')) {
      this.registerCapabilityListener('se_fanlevel', (value, opts) => {
        return this.onUpdateFanlevel(value, opts);
      });
    }

    if (this.hasCapability('se_onoff')) {
      this.registerCapabilityListener('se_onoff', async (value, opts) => {
        return value ? this.onActionTurnOn({ device: this }) : this.onActionTurnOff({ device: this });
      });
    }
  }

  deviceName = () => 'SensiboPureDevice';

};
