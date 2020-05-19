'use strict';

const Homey = require('homey');

class SensiboApp extends Homey.App {

  onInit() {
    this.log('SensiboApp is running...');

    this._turnedOnTrigger = new Homey.FlowCardTriggerDevice('se_onoff_true');
    this._turnedOnTrigger
      .register();

    this._turnedOffTrigger = new Homey.FlowCardTriggerDevice('se_onoff_false');
    this._turnedOffTrigger
      .register();

    this._offlineTrigger = new Homey.FlowCardTriggerDevice('se_offline');
    this._offlineTrigger
      .register();

    new Homey.FlowCardCondition('se_onoff_is_on')
      .register()
      .registerRunListener((args, state) => args.device.getCapabilityValue('se_onoff'));

    new Homey.FlowCardAction('sensibo_on')
      .register()
      .registerRunListener((args, state) => args.device.onActionTurnOn());

    new Homey.FlowCardAction('sensibo_off')
      .register()
      .registerRunListener((args, state) => args.device.onActionTurnOff());

    new Homey.FlowCardAction('sensibo_mode')
      .register()
      .registerRunListener((args, state) => args.device.onActionSetMode(args.mode));

    new Homey.FlowCardAction('sensibo_fanlevel')
      .register()
      .registerRunListener((args, state) => args.device.onActionSetFanLevel(args.fanLevel));

    new Homey.FlowCardAction('sensibo_fandirection')
      .register()
      .registerRunListener((args, state) => args.device.onActionSetFanDirection(args.fanDirection));

  }

}

module.exports = SensiboApp;