'use strict';

const BaseDevice = require('../../lib/BaseDevice');

module.exports = class SensiboRoomSensorDevice extends BaseDevice {

  deviceName = () => 'SensiboRoomSensorDevice';

  async fetchRemoteCapabilities() {
  }

};
