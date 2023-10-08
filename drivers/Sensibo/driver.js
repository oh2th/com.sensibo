'use strict';

const BaseDriver = require('../../lib/BaseDriver');

module.exports = class SensiboDriver extends BaseDriver {

  driverName = () => 'SensiboDriver';

  filterProductModel = (device) => {
    return device.productModel && (device.productModel.includes('sky') || device.productModel.includes('airq'));
  }

};
