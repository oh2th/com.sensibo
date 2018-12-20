'use strict';

const Homey = require('homey');
const http = require('http.min');

const SENSIBO_API = 'https://home.sensibo.com/api/v2';

class SensiboDriver extends Homey.Driver {

    onInit() {
        this.log('Sensibo driver has been initialized');
    }

    onPairListDevices(data, callback) {
        this.getAllDevices()
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

    getAllDevices() {
        return http({
            uri: SENSIBO_API + '/users/me/pods?fields=id,room&apiKey=' + Homey.env.API_KEY,
            json: true
        });
    }

}

module.exports = SensiboDriver;
