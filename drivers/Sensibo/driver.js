'use strict';

const Homey = require('homey');
const Sensibo = require('../../lib/sensibo');

module.exports = class SensiboDriver extends Homey.Driver {

  onInit() {
    this.log('Sensibo driver has been initialized');
  }

  onPairListDevices(data, callback) {
    let sensibo = new Sensibo({
      Homey: Homey,
      logger: this.log
    });
    if (!sensibo.hasApiKey()) {
      callback(new Error("The API-key must be configured."));
    } else {
      sensibo.getAllDevices()
        .then(data => {
          if (!data.data || !data.data.result || data.data.result.length === 0) {
            callback(new Error("Failed to retrieve devices."));
          } else {
            let result = data.data.result;
            let devices = [];
            for (let i = 0; i < result.length; i++) {
              devices.push({
                "name": `Sensibo ${result[i].room.name}`,
                "data": {
                  "id": result[i].id
                }
              });
            }
            callback(null, devices);
          }
        })
        .catch(err => {
          callback(new Error("Failed to retrieve devices."));
        });
    }
  }

};
