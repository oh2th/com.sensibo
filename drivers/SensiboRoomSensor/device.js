'use strict';

const BaseDevice = require('../BaseDevice');

module.exports = class SensiboRoomSensorDevice extends BaseDevice {

  deviceName = () => 'SensiboRoomSensorDevice';

  async fetchRemoteCapabilities() {
    if (this.hasCapability('measure_battery') === false) {
      await this.addCapability('measure_battery');
    }
  }

};
