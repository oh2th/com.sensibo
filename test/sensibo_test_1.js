const chai = require('chai');
const expect = chai.expect;

const Sensibo = require('../lib/sensibo');

describe("Sensibo", function () {
    describe("getUri", function () {
        it("getUri 1", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            expect(sensibo.getUri()).to.equal('https://home.sensibo.com/api/v2');
        });
    });

    describe("getDeviceId", function () {
        it("getDeviceId 1", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            expect(sensibo.getDeviceId()).to.equal('12345');
        });
    });

    describe("getAcState", function () {
        it("getAcState 1", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            expect(sensibo.getAcState()['on']).to.equal(true);
            expect(sensibo.getAcState()['mode']).to.equal('heat');
            expect(sensibo.getAcState()['fanLevel']).to.equal('auto');
            expect(sensibo.getAcState()['targetTemperature']).to.equal(21);
            expect(sensibo.getAcState()['temperatureUnit']).to.equal('C');
            expect(sensibo.getAcState()['swing']).to.equal('rangeFull');
        });
    });

    describe("hasApiKey & getApiKey", function () {
        it("hasApiKey 1", function () {
            let sensibo = new Sensibo({
                Homey: undefined, deviceId: '12345', logger: undefined
            });
            expect(sensibo.hasApiKey()).to.equal(false);
        });
        it("hasApiKey 2", function () {
            let sensibo = new Sensibo({
                Homey: {
                    ManagerSettings: {
                        get: function () {
                            return 'some-api-key'
                        }
                    }
                }, deviceId: '12345', logger: undefined
            });
            expect(sensibo.hasApiKey()).to.equal(true);
            expect(sensibo.getApiKey()).to.equal('some-api-key');
        });
    });

    describe("getAllDevicesUri", function () {
        it("getAllDevicesUri 1", function () {
            let sensibo = new Sensibo({
                Homey: {
                    ManagerSettings: {
                        get: function () {
                            return 'some-api-key1'
                        }
                    }
                }, deviceId: '12345'
            });
            expect(sensibo.getAllDevicesUri()).to.equal('https://home.sensibo.com/api/v2/users/me/pods?fields=id,room&apiKey=some-api-key1');
        });
    });

    describe("getSpecificDeviceInfoUri", function () {
        it("getSpecificDeviceInfoUri 1", function () {
            let sensibo = new Sensibo({
                Homey: {
                    ManagerSettings: {
                        get: function () {
                            return 'some-api-key2'
                        }
                    }
                }, deviceId: '12345'
            });
            expect(sensibo.getSpecificDeviceInfoUri()).to.equal('https://home.sensibo.com/api/v2/pods/12345?fields=measurements,acState&apiKey=some-api-key2');
        });
    });

    describe("updateAcState", function () {
        it("updateAcState 1", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            sensibo.updateAcState({on: false});
            expect(sensibo.getAcState()['on']).to.equal(false);
        });
        it("updateAcState 2", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            sensibo.updateAcState({mode: 'off'});
            expect(sensibo.getAcState()['mode']).to.equal('off');
        });
        it("updateAcState 3", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            sensibo.updateAcState({fanLevel: 'high'});
            expect(sensibo.getAcState()['fanLevel']).to.equal('high');
        });
        it("updateAcState 4", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            sensibo.updateAcState({targetTemperature: 30});
            expect(sensibo.getAcState()['targetTemperature']).to.equal(30);
        });
        it("updateAcState 5", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            sensibo.updateAcState({temperatureUnit: 'F'});
            expect(sensibo.getAcState()['temperatureUnit']).to.equal('F');
        });
        it("updateAcState 6", function () {
            let sensibo = new Sensibo({Homey: undefined, deviceId: '12345', logger: undefined});
            sensibo.updateAcState({swing: 'stopped'});
            expect(sensibo.getAcState()['swing']).to.equal('stopped');
        });
    });

    describe("setAcStateUri", function () {
        it("setAcStateUri 1", function () {
            let sensibo = new Sensibo({
                Homey: {
                    ManagerSettings: {
                        get: function () {
                            return 'some-api-key3'
                        }
                    }
                }, deviceId: '12345'
            });
            expect(sensibo.setAcStateUri()).to.equal('https://home.sensibo.com/api/v2/pods/12345/acStates?apiKey=some-api-key3');
        });
    });


});