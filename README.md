# Sensibo

For https://sensibo.com/ air condition controllers.

To install:

1. Get an API-key from https://home.sensibo.com/me/api
1. Add a env.json file, with your API-key: ```{
   "API_KEY": "insert api key here"
}```

3. Install the app: ```athom app run --clean``` or ```athom app install```.



## Device: Sensibo

#### Triggers

- The temperature changed.
- The humidity changed.
- The device turned off.
- The device turned on.

#### Conditions

- The device is on / off.

#### Actions

- Set the target temperature.
- Turn the device on.
- Turn the device off.
- Set the mode.
- Set the fan level.

## Acknowledgements:

## Feedback:

Please report issues at the [issues section on Github](https://github.com/balmli/com.sensibo/issues).

## Release Notes:

#### 0.0.1

- Initial version