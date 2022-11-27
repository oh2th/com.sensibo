# Sensibo

For Sensibo Sky, Sensibo Air, Sensibo Pure and Sensibo Room Sensors.

To install:

1. Get an API-key from https://home.sensibo.com/me/api
2. Set the API-key during pairing of the device

## Device: Sensibo

#### Triggers

- The target temperature changed.
- Thermostat mode changed.
- The temperature changed.
- The humidity changed.
- Device turned on.
- Device turned off.
- Device offline.
- Timer created.
- Timer fired.
- Timer deleted.
- AC state changed.
- Climate React changed.

#### Conditions

- Thermostat mode is.
- Is on.
- Climate React is enabled / disabled.
- Timer is enabled / disabled.

#### Actions

- Set the temperature.
- Set the mode (Automatic, Heat, Cool, Off)
- Turn on.
- Turn off.
- Set the fan mode.
- Set the fan level.
- Set Swing mode.
- Set Horizontal swing mode.
- Control Climate React.
- Control Pure Boost.
- Control light.
- Sync power state.
- Set timer.
- Delete timer.

#### Capabilities

- On / off
- Fan level
- Fan mode
- Target temperature
- Swing
- Horizontal swing
- Climate React
- Temperature
- Humidity
- Last seen

## Device: Sensibo Pure

#### Triggers

- The temperature changed.
- The humidity changed.
- Device turned on.
- Device turned off.
- Air quality changed.
- Device offline.
- Timer created.
- Timer fired.
- Timer deleted.

#### Conditions

- Is on.
- Timer is enabled / disabled.

#### Actions

- Turn on.
- Turn off.
- Set the fan level.
- Control Pure Boost.
- Control light.
- Set timer.
- Delete timer.

#### Capabilities

- On / off
- Fan level
- Temperature
- Humidity
- Last seen

## Device: Sensibo Room Sensor

#### Triggers

- The temperature changed.
- The humidity changed.
- Device offline.

#### Capabilities

- Temperature
- Humidity
- Last seen

## Release Notes:

#### 1.12.0

- Updated pairing screens

#### 1.11.0

- Added 'Is light turned on/off' condition

#### 1.10.2

- Fixed bug when changing settings

#### 1.10.1

- Added Control Pure Boost action for Sensibo Pure
- Options for lights (on, off, dim) are now fetched from remote capabilities

#### 1.10.0

- Added support for Sensibo Pure and Sensibo Room Sensor

#### 1.9.5

- Added horizontal swing (capability and action card)
- Added action to sync the power state
- Added action to control Pure Boost
- Added action to control the AC light
- Added fan levels (Medium high,  Medium low, Quiet)
- Fixes for pairing

#### 1.8.0

- Changed minimum temperature to 10 deg. C
- Updated to SDK 3

#### 1.7.1

- Minor bug fix

#### 1.7.0

- Dynamic list of modes and fan levels when setting from flows

#### 1.6.1

- Added triggers for timers

#### 1.5.1

- Added trigger for AC state changes
- Fixed minor bug when deleting devices

#### 1.4.1

- Fixed client for timers

#### 1.4.0

- Added support for timers
- Added trigger for Climate React changed

#### 1.3.1

- Added condition for 'Climate React is enabled / disabled'
- Changed minimum polling interval to 15 seconds

#### 1.3.0

- Added support for Climate React

#### 1.2.1

- Added support for 'Horizontal' and 'Both' swing modes
- Added check for supported swing mode

#### 1.2.0

- Added 'Last seen' timestamp
- Added 'Sensibo offline' trigger

#### 1.1.0

- Added support for Swing modes
- Fixed settings page
- Use Homey compose

#### 1.0.0

- Fix support and source urls

#### 0.4.0

- Possible to turn on / off, change fan mode and fan level from the app (the device must be reinstalled for this)
- Removed duplicate triggers for temperature and humidity

#### 0.3.0

- Fix if more than 1 Sensibo

#### 0.2.0

- Beta version for app store
