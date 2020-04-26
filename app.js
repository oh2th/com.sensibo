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

        new Homey.FlowCardCondition('se_onoff_is_on')
          .register()
          .registerRunListener((args, state) => args.device.getCapabilityValue('se_onoff'));

        new Homey.FlowCardAction('sensibo_on')
          .register()
          .registerRunListener((args, state) => args.device.onActionTurnOn(args, state));

        new Homey.FlowCardAction('sensibo_off')
          .register()
          .registerRunListener((args, state) => args.device.onActionTurnOff(args, state));

        new Homey.FlowCardAction('sensibo_mode')
          .register()
          .registerRunListener((args, state) => args.device.onActionSetMode(args, state));

        new Homey.FlowCardAction('sensibo_fanlevel')
          .register()
          .registerRunListener((args, state) => args.device.onActionSetFanLevel(args, state));

    }

}

module.exports = SensiboApp;