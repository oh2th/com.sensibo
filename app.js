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

    this._climateReactChangedTrigger = new Homey.FlowCardTriggerDevice('se_climate_react_changed');
    this._climateReactChangedTrigger
      .register();

    new Homey.FlowCardCondition('se_onoff_is_on')
      .register()
      .registerRunListener((args, state) => args.device.getCapabilityValue('se_onoff'));

    new Homey.FlowCardCondition('se_climate_react_enabled')
      .register()
      .registerRunListener((args, state) => args.device.getCapabilityValue('se_climate_react') === 'on');

    new Homey.FlowCardCondition('se_timer_enabled')
      .register()
      .registerRunListener((args, state) => args.device.isTimerEnabled());

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

    new Homey.FlowCardAction('sensibo_cr')
      .register()
      .registerRunListener((args, state) => args.device.onActionClimateReact(args.enabled));

    new Homey.FlowCardAction('sensibo_delete_timer')
      .register()
      .registerRunListener((args, state) => args.device.onDeleteTimer());

    new Homey.FlowCardAction('sensibo_set_timer')
      .register()
      .registerRunListener((args, state) => args.device.onSetTimer(args.minutesFromNow, args.on, args.mode, args.fanLevel, args.targetTemperature));

  }

}

module.exports = SensiboApp;