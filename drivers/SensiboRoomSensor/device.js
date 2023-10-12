'use strict';

const BaseDevice = require('../BaseDevice');

module.exports = class SensiboRoomSensorDevice extends BaseDevice {

  deviceName = () => 'SensiboRoomSensorDevice';

  async fetchRemoteCapabilities() {
  }

};
