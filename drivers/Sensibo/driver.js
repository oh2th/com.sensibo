'use strict';

const Homey = require('homey');
const Sensibo = require('../../lib/sensibo');

module.exports = class SensiboDriver extends Homey.Driver {

  onInit() {
    this.log('Sensibo driver has been initialized');
  }

  async onPair(session) {
    let apikey;
    let sensibo;

    session.setHandler("enter_api_key", async (data) => {
      apikey = data.apikey;
      sensibo = new Sensibo({
        apikey: apikey,
        logger: this.log
      });
    });

    session.setHandler("list_devices", async () => {
      const devices = await sensibo.getAllDevices();
      if (!devices.data || !devices.data.result) {
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (devices.data.result.length === 0) {
        throw new Error(this.homey.__('errors.no_devices'));
      }
      return devices.data.result
        .map(device => ({
          "name": `Sensibo ${device.room.name}`,
          "data": {
            "id": device.id
          }
        }));
    });
  }

  async onRepair(session, device) {
    let apikey;
    let sensibo;

    session.setHandler("enter_api_key", async (data) => {
      apikey = data.apikey;
      sensibo = new Sensibo({
        apikey: apikey,
        logger: this.log
      });

      const devices = await sensibo.getAllDevices();
      if (!devices.data || !devices.data.result) {
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (devices.data.result.length === 0) {
        throw new Error(this.homey.__('errors.no_devices'));
      }
      await device.setStoreValue('apikey', apikey);
      await device.setAvailable();
      await session.done();
      return true;
    });

  }

};
