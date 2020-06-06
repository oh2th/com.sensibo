# Sensibo

For https://sensibo.com/ air condition controllers.

To install:

1. Get an API-key from https://home.sensibo.com/me/api
2. Install the app
3. Configure the API-key in the Configure app menu.  This must be done before adding the Sensibo device.

## Device: Sensibo

#### Triggers

- The target temperature changed.
- Thermostat mode changed.
- The temperature changed.
- The humidity changed.
- Sensibo turned on.
- Sensibo turned off.
- Sensibo offline.

#### Conditions

- Thermostat mode is.
- Sensibo is on.

#### Actions

- Set the temperature.
- Set the mode (Automatic, Heat, Cool, Off)
- Turn on.
- Turn off.
- Set the fan mode (Cool, Heat, Fan, Auto, Dry)
- Set the fan level.
- Set Swing mode.
- Control Climate React.

## Acknowledgements:

## Feedback:

Please report issues at the [issues section on Github](https://github.com/balmli/com.sensibo/issues).

## Release Notes:

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
