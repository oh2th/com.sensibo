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

        this._temperatureChangedTrigger = new Homey.FlowCardTriggerDevice('se_temperature_changed');
        this._temperatureChangedTrigger
            .register();

        this._humidityChangedTrigger = new Homey.FlowCardTriggerDevice('se_humidity_changed');
        this._humidityChangedTrigger
            .register();

        this._turnedOnTrigger = new Homey.FlowCardTriggerDevice('se_onoff_true');
        this._turnedOnTrigger
            .register();

        this._turnedOffTrigger = new Homey.FlowCardTriggerDevice('se_onoff_false');
        this._turnedOffTrigger
            .register();

        new Homey.FlowCardCondition('se_onoff_is_on')
            .register()
            .registerRunListener((args, state) => args.device.getCapabilityValue('se_onoff'));

        new Homey.FlowCardAction('sensibo_on')
            .register()
            .registerRunListener(this.onActionTurnOn.bind(this));

        new Homey.FlowCardAction('sensibo_off')
            .register()
            .registerRunListener(this.onActionTurnOff.bind(this));

        new Homey.FlowCardAction('sensibo_mode')
            .register()
            .registerRunListener(this.onActionSetMode.bind(this));

        new Homey.FlowCardAction('sensibo_fanlevel')
            .register()
            .registerRunListener(this.onActionSetFanLevel.bind(this));

        this.registerCapabilityListener('target_temperature', (value, opts) => {
            return this.onUpdateTargetTemperature(value, opts);
        });

        this.registerCapabilityListener('thermostat_mode', (value, opts) => {
            return this.onUpdateThermostatMode(value, opts);
        });

        this.registerCapabilityListener('se_fanlevel', (value, opts) => {
            return this.onUpdateFanlevel(value, opts);
        });

        this.registerCapabilityListener('se_onoff', async (value, opts) => {
            return value ? this.onActionTurnOn({device: this}) : this.onActionTurnOff({device: this});
        });

        this.scheduleCheckData(2);
    }

    onAdded() {
        this.log('virtual device added:', this.getData().id);
    }

    onDeleted() {
        this.log('virtual device deleted');
    }

    async checkData() {
        this.clearCheckData();
        this.log(`Fetching AC state for: ${this._sensibo.getDeviceId()}`);
        let data = await this._sensibo.getSpecificDeviceInfo();
        await this.onDeviceInfoReceived(data);
        this.scheduleCheckData();
    }

    async onDeviceInfoReceived(data) {
        this.log(`AC state for: ${this._sensibo.getDeviceId()}`, data.data);
        if (data.data) {
            let result = data.data.result;
            this._sensibo.updateAcState(result.acState);
            if (await this.updateIfChanged('se_onoff', result.acState.on)) {
                if (result.acState.on) {
                    this._turnedOnTrigger.trigger(this);
                } else {
                    this._turnedOffTrigger.trigger(this);
                }
            }
            await this.updateIfChanged('target_temperature', result.acState.targetTemperature);
            if (result.acState.mode === 'auto' || result.acState.mode === 'heat' || result.acState.mode === 'cool') {
                await this.updateIfChanged('thermostat_mode', result.acState.mode);
            }
            await this.updateIfChanged('se_fanlevel', result.acState.fanLevel);
            if (await this.updateIfChanged('measure_temperature', result.measurements.temperature)) {
                this._temperatureChangedTrigger.trigger(this, {temperature: result.measurements.temperature});
            }
            if (await this.updateIfChanged('measure_humidity', result.measurements.humidity)) {
                this._humidityChangedTrigger.trigger(this, {humidity: result.measurements.humidity});
            }
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

    scheduleCheckData(seconds = 60) {
        this.clearCheckData();
        this.curTimeout = setTimeout(this.checkData.bind(this), seconds * 1000);
    }

    async onActionTurnOn(args, state) {
        try {
            args.device.clearCheckData();
            args.device.log(`turn on: ${args.device._sensibo.getDeviceId()}`);
            await args.device._sensibo.setAcState({on: true});
            await args.device.setCapabilityValue('se_onoff', true).catch(console.error);
            args.device._turnedOnTrigger.trigger(args.device);
            args.device.log(`turned on OK: ${args.device._sensibo.getDeviceId()}`);
        } finally {
            args.device.scheduleCheckData();
        }
    }

    async onActionTurnOff(args, state) {
        try {
            args.device.clearCheckData();
            args.device.log(`turn off: ${args.device._sensibo.getDeviceId()}`);
            await args.device._sensibo.setAcState({on: false});
            await args.device.setCapabilityValue('se_onoff', false).catch(console.error);
            args.device._turnedOffTrigger.trigger(args.device);
            args.device.log(`turned off OK: ${args.device._sensibo.getDeviceId()}`);
        } finally {
            args.device.scheduleCheckData();
        }
    }

    async onActionSetMode(args, state) {
        await args.device.onUpdateThermostatMode(args.mode);
        await args.device.setCapabilityValue('thermostat_mode', args.mode).catch(console.error);
    }

    async onActionSetFanLevel(args, state) {
        await args.device.onUpdateFanlevel(args.fanLevel);
        await args.device.setCapabilityValue('se_fanlevel', args.fanLevel).catch(console.error);
    }

    async onUpdateTargetTemperature(value, opts) {
        try {
            this.clearCheckData();
            this.log(`set target temperature: ${this._sensibo.getDeviceId()} -> ${value}`);
            await this._sensibo.setAcState({targetTemperature: value});
            this.log(`set target temperature OK: ${this._sensibo.getDeviceId()} -> ${value}`);
        } finally {
            this.scheduleCheckData();
        }
    }

    async onUpdateThermostatMode(value, opts) {
        try {
            this.clearCheckData();
            this.log(`set thermostat mode: ${this._sensibo.getDeviceId()} -> ${value}`);
            const onOff = value !== 'off';
            await this._sensibo.setAcState({
                on: onOff,
                mode: onOff ? value : undefined
            });
            if (onOff !== this.getCapabilityValue('se_onoff')) {
                await this.setCapabilityValue('se_onoff', onOff).catch(console.error);
                if (onOff) {
                    this._turnedOnTrigger.trigger(this);
                } else {
                    this._turnedOffTrigger.trigger(this);
                }
            }
            this.log(`set thermostat mode OK: ${this._sensibo.getDeviceId()} -> ${value}`);
        } finally {
            this.scheduleCheckData();
        }
    }

    async onUpdateFanlevel(value, opts) {
        try {
            this.clearCheckData();
            this.log(`set fanLevel: ${this._sensibo.getDeviceId()} -> ${value}`);
            await this._sensibo.setAcState({fanLevel: value});
            this.log(`set fanLevel OK: ${this._sensibo.getDeviceId()} -> ${value}`);
        } finally {
            this.scheduleCheckData();
        }
    }

};
