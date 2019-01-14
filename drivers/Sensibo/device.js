'use strict';

const Homey = require('homey');
const http = require('http.min');

const SENSIBO_API = 'https://home.sensibo.com/api/v2';

class SensiboDevice extends Homey.Device {

    onInit() {
        this.log('virtual device initialized');

        this._deviceId = this.getData().id;
        this._deviceName = this.getName();
        this._acState = {
            on: true,
            mode: "heat",
            fanLevel: "auto",
            targetTemperature: 21,
            temperatureUnit: "C"
        };

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

        this._onoffCondition = new Homey.FlowCardCondition('se_onoff_is_on')
            .register()
            .registerRunListener((args, state) => args.device.getCapabilityValue('se_onoff'));

        this._onAction = new Homey.FlowCardAction('sensibo_on')
            .register()
            .registerRunListener(this.onActionTurnOn.bind(this));

        this._offAction = new Homey.FlowCardAction('sensibo_off')
            .register()
            .registerRunListener(this.onActionTurnOff.bind(this));

        this._modeAction = new Homey.FlowCardAction('sensibo_mode')
            .register()
            .registerRunListener(this.onActionSetMode.bind(this));

        this._fanLevelAction = new Homey.FlowCardAction('sensibo_fanlevel')
            .register()
            .registerRunListener(this.onActionSetFanLevel.bind(this));

        this.registerCapabilityListener('target_temperature', (value, opts) => {
            return this.onUpdateTargetTemperature(value, opts);
        });

        this.scheduleCheckData(5);
    }

    onAdded() {
        this.log('virtual device added:', this.getData().id);
    }

    onDeleted() {
        this.log('virtual device deleted');
    }

    getApiKey() {
        return Homey.ManagerSettings.get('apikey');
    }

    checkData() {
        this.clearCheckData();
        if (this._deviceId) {
            this.log(`Start fetching state from device: ${this._deviceId} - ${this._deviceName}`);
            this.getSpecificDeviceInfo(this._deviceId)
                .then(data => this.onDeviceInfoReceived(this._deviceId, data))
                .catch(err => this.log('ERROR fetching device info', err));
        }
        this.scheduleCheckData(60);
    }

    onDeviceInfoReceived(deviceId, data) {
        this.log('device info for ' + deviceId, data.data);
        if (data.data) {
            let result = data.data.result;
            if (result.measurements.temperature !== this.getCapabilityValue('measure_temperature')) {
                this._temperatureChangedTrigger.trigger(this, {temperature: result.measurements.temperature});
                this.setCapabilityValue('measure_temperature', result.measurements.temperature);
            }
            if (result.measurements.humidity !== this.getCapabilityValue('measure_humidity')) {
                this._humidityChangedTrigger.trigger(this, {humidity: result.measurements.humidity});
                this.setCapabilityValue('measure_humidity', result.measurements.humidity);
            }
            if (this._acState.on !== result.acState.on) {
                this.setCapabilityValue('se_onoff', result.acState.on);
                if (result.acState.on) {
                    this._turnedOnTrigger.trigger(this);
                } else {
                    this._turnedOffTrigger.trigger(this);
                }
            }
            if (result.acState.targetTemperature !== this.getCapabilityValue('target_temperature')) {
                this.setCapabilityValue('target_temperature', result.acState.targetTemperature);
            }
            this._acState = {
                on: result.acState.on,
                mode: result.acState.mode,
                fanLevel: result.acState.fanLevel,
                targetTemperature: result.acState.targetTemperature,
                temperatureUnit: result.acState.temperatureUnit
            };
        }
    }

    clearCheckData() {
        if (this.curTimeout) {
            clearTimeout(this.curTimeout);
            this.curTimeout = undefined;
        }
    }

    scheduleCheckData(seconds) {
        this.clearCheckData();
        this.log(`Checking data in ${seconds} seconds`);
        this.curTimeout = setTimeout(this.checkData.bind(this), seconds * 1000);
    }

    async onActionTurnOn(args, state) {
        args.device.log('onActionTurnOn', args.device._deviceId);
        args.device._acState.on = true;
        args.device.setCapabilityValue('se_onoff', true);
        args.device.setAcState(args.device._deviceId, args.device._acState)
            .then(data => {
                if (data.response.statusCode !== 200) {
                    args.device.log('ERROR turning on', data.response);
                    return Promise.reject(data.response.statusCode);
                }
                this._turnedOnTrigger.trigger(args.device);
                args.device.log('turned on', args.device._deviceId);
                return Promise.resolve(true);
            })
            .catch(err => args.device.log('ERROR', err));
    }


    async onActionTurnOff(args, state) {
        args.device.log('onActionTurnOff', args.device._deviceId);
        args.device._acState.on = false;
        args.device.setCapabilityValue('se_onoff', false);
        args.device.setAcState(args.device._deviceId, args.device._acState)
            .then(data => {
                if (data.response.statusCode !== 200) {
                    args.device.log('ERROR turning off', data.response);
                    return Promise.reject(data.response.statusCode);
                }
                this._turnedOffTrigger.trigger(args.device);
                args.device.log('turned off');
                return Promise.resolve(true);
            })
            .catch(err => args.device.log('ERROR', err));
    }

    onActionSetMode(args, state) {
        args.device._acState.mode = args.mode;
        args.device.setAcState(args.device._deviceId, args.device._acState)
            .then(data => {
                if (data.response.statusCode !== 200) {
                    args.device.log('ERROR setting mode', data.response);
                    return Promise.reject(data.response.statusCode);
                }
                args.device.log('set mode', args.mode);
                return Promise.resolve(true);
            })
            .catch(err => args.device.log('ERROR', err));
    }

    onActionSetFanLevel(args, state) {
        args.device._acState.fanLevel = args.fanLevel;
        args.device.setAcState(args.device._deviceId, args.device._acState)
            .then(data => {
                if (data.response.statusCode !== 200) {
                    args.device.log('ERROR setting fan leven', data.response);
                    return Promise.reject(data.response.statusCode);
                }
                args.device.log('set fan level', args.fanLevel);
                return Promise.resolve(true);
            })
            .catch(err => args.device.log('ERROR', err));
    }

    onUpdateTargetTemperature(value, opts) {
        this._acState.targetTemperature = value;
        this.setAcState(this._deviceId, this._acState)
            .then(data => {
                if (data.response.statusCode !== 200) {
                    this.log('ERROR setting target temperature', data.response);
                    return Promise.reject(data.response.statusCode);
                }
                this.log('updated target temperature', value);
                return Promise.resolve(true);
            })
            .catch(err => this.log('ERROR', err));
    }

    getSpecificDeviceInfo(deviceId) {
        return http({
            uri: SENSIBO_API + '/pods/' + deviceId + '?fields=measurements,acState&apiKey=' + this.getApiKey(),
            json: true
        });
    }

    setAcState(deviceId, acState) {
        this.log('setAcState', deviceId, acState);
        return http.post({
            uri: SENSIBO_API + '/pods/' + deviceId + '/acStates?apiKey=' + this.getApiKey(),
            json: true
        }, {acState: acState});
    }

}

module.exports = SensiboDevice;