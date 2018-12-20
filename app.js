'use strict';

const Homey = require('homey');

class SensiboApp extends Homey.App {

    onInit() {
        this.log('SensiboApp is running...');
    }

}

module.exports = SensiboApp;