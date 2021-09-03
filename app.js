'use strict';

const Homey = require('homey');

class SensiboApp extends Homey.App {

  async onInit() {
    await this._initFlows();
    this.log('SensiboApp is running...');
  }

  async _initFlows() {
    this._turnedOnTrigger = this.homey.flow.getDeviceTriggerCard('se_onoff_true');
    this._turnedOffTrigger = this.homey.flow.getDeviceTriggerCard('se_onoff_false');
    this._offlineTrigger = this.homey.flow.getDeviceTriggerCard('se_offline');
    this._acStateChangedTrigger = this.homey.flow.getDeviceTriggerCard('se_ac_state_changed');
    this._climateReactChangedTrigger = this.homey.flow.getDeviceTriggerCard('se_climate_react_changed');
    this._timerCreatedTrigger = this.homey.flow.getDeviceTriggerCard('se_timer_created');
    this._timerFiredTrigger = this.homey.flow.getDeviceTriggerCard('se_timer_fired');
    this._timerDeletedTrigger = this.homey.flow.getDeviceTriggerCard('se_timer_deleted');

    this.homey.flow.getConditionCard('se_onoff_is_on')
      .registerRunListener((args, state) => args.device.getCapabilityValue('se_onoff'));

    this.homey.flow.getConditionCard('se_climate_react_enabled')
      .registerRunListener((args, state) => args.device.getCapabilityValue('se_climate_react') === 'on');

    this.homey.flow.getConditionCard('se_timer_enabled')
      .registerRunListener((args, state) => args.device.isTimerEnabled());

    this.homey.flow.getActionCard('sensibo_on')
      .registerRunListener((args, state) => args.device.onActionTurnOn());

    this.homey.flow.getActionCard('sensibo_off')
      .registerRunListener((args, state) => args.device.onActionTurnOff());

    this.homey.flow.getActionCard('sensibo_mode')
      .registerRunListener((args, state) => args.device.onActionSetMode(args.mode));

    this.homey.flow.getActionCard('sensibo_mode2')
      .registerRunListener((args, state) => args.device.onActionSetMode(args.mode.id))
      .getArgument('mode')
      .registerAutocompleteListener((query, args) => args.device.onModeAutocomplete(query, args));

    this.homey.flow.getActionCard('sensibo_fanlevel')
      .registerRunListener((args, state) => args.device.onActionSetFanLevel(args.fanLevel));

    this.homey.flow.getActionCard('sensibo_fanlevel2')
      .registerRunListener((args, state) => args.device.onActionSetFanLevel(args.fanLevel.id))
      .getArgument('fanLevel')
      .registerAutocompleteListener((query, args) => args.device.onFanLevelAutocomplete(query, args));

    this.homey.flow.getActionCard('sensibo_fandirection')
      .registerRunListener((args, state) => args.device.onActionSetFanDirection(args.fanDirection));

    this.homey.flow.getActionCard('sensibo_cr')
      .registerRunListener((args, state) => args.device.onActionClimateReact(args.enabled));

    this.homey.flow.getActionCard('sensibo_delete_timer')
      .registerRunListener((args, state) => args.device.onDeleteTimer());

    this.homey.flow.getActionCard('sensibo_set_timer')
      .registerRunListener((args, state) => args.device.onSetTimer(args.minutesFromNow, args.on, args.mode, args.fanLevel, args.targetTemperature));

  }

}

module.exports = SensiboApp;