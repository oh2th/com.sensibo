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

    session.setHandler("apikey_input", async (data) => {
      apikey = data.apikey;
      sensibo = new Sensibo({
        apikey: apikey,
        logger: this.log
      });
      await session.showView('list_devices');
    });

    session.setHandler("list_devices", async () => {
      let devices;
      try {
        devices = await sensibo.getAllDevices();
      } catch (err) {
        this.log('onPair getAllDevices failed:', err);
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (!devices.data || !devices.data.result) {
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (devices.data.result.length === 0) {
        throw new Error(this.homey.__('errors.no_devices'));
      }
      return devices.data.result
        .map(device => ({
          name: `Sensibo ${device.room.name}`,
          data: {
            id: device.id
          },
          store: {
            apikey: apikey
          }
        }));
    });
  }

  async onRepair(session, device) {
    let apikey;
    let sensibo;

    session.setHandler("apikey_input", async (data) => {
      apikey = data.apikey;
      sensibo = new Sensibo({
        apikey: apikey,
        logger: this.log
      });

      let devices;
      try {
        devices = await sensibo.getAllDevices();
      } catch (err) {
        this.log('onRepair getAllDevices failed:', err);
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (!devices.data || !devices.data.result) {
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (devices.data.result.length === 0) {
        throw new Error(this.homey.__('errors.no_devices'));
      }
      await device.setStoreValue('apikey', apikey);
      await device.setAvailable();
      this.log('onRepair OK');
      await session.done();
      return true;
    });

  }

};
