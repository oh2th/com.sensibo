'use strict';

const Homey = require('homey');
const Sensibo = require('../../lib/sensibo');

module.exports = class SensiboDriver extends Homey.Driver {

  onInit() {
    this.log('Sensibo driver has been initialized');
  }

  async onPairListDevices() {
    const sensibo = new Sensibo({
      homey: this.homey,
      logger: this.log
    });

    if (!sensibo.hasApiKey()) {
      throw new Error("The API-key must be configured.");
    }

    const data = await sensibo.getAllDevices();
    if (!data.data || !data.data.result) {
      throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
    }
    if (data.data.result.length === 0) {
      throw new Error(this.homey.__('errors.no_devices'));
    }

    return data.data.result
      .map(device => ({
        "name": `Sensibo ${device.room.name}`,
        "data": {
          "id": device.id
        }
      }));
  }

};
