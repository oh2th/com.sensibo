'use strict';

const http = require('http.min');

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

    getUri() {
        return 'https://home.sensibo.com/api/v2';
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
        return http({uri: this.getAllDevicesUri(), json: true});
    }

    getSpecificDeviceInfoUri() {
        return `${this.getUri()}/pods/${this.getDeviceId()}?fields=measurements,acState&apiKey=${this.getApiKey()}`;
    }

    async getSpecificDeviceInfo() {
        return http({uri: this.getSpecificDeviceInfoUri(), json: true});
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
        let data = await http.post({uri: this.setAcStateUri(), json: true}, {acState: this._acState});
        if (data.response.statusCode !== 200) {
            throw new Error(`Error setting AC state (${data.response.statusCode} - ${data.response.statusMessage})`);
        }
        return data;
    }

};