'use strict';

const Homey = require('homey');

class SensiboDriver extends Homey.Driver {

    onInit() {
        this.log('Sensibo driver has been initialized');
    }

    onPairListDevices(data, callback) {
        let devices = [
            {
                "name": "Sensibo",
                "data": {
                    "id": guid()
                }
            }
        ];
        callback(null, devices);
    }

}

module.exports = SensiboDriver;

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
