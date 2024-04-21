'use strict';

const BaseDevice = require('../BaseDevice');

module.exports = class SensiboPureDevice extends BaseDevice {

	async registerCapabilityListeners() {
		this.registerCapabilityListener('se_fanlevel_pure', (value, opts) => {
			return this.onUpdateFanlevel(value, opts);
		});

		this.registerCapabilityListener('se_onoff', async (value, opts) => {
			return value ? this.onActionTurnOn({ device: this }) : this.onActionTurnOff({ device: this });
		});
	}

	deviceName = () => 'SensiboPureDevice';

};
