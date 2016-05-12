# homebridge-rasppi-gpio-garagedoor
Raspberry Pi GPIO GarageDoor plugin for [HomeBridge](https://github.com/nfarina/homebridge), fork of Ben Lamonica's plugin but removed dependency to start monitoring gpio pins continuously. My fork uses a Python script to check the status in realtime and send command to open or close in realtime.

# Installation

  1. Install python-shell via npm
  2. Install this plugin by downloading source and using: npm install -g from root of project folder
  3. Update your configuration file. See sample-config.json snippet below.
  4. Update python scripts to use gpio pins you have in your wiring setup. Note that my relay was off on high and on  with low.
# Configuration

Configuration sample:

 ```
    "accessories": [
        {
            "accessory": "RaspPiGPIOGarageDoor",
            "name": "Garage Door",
            "doorPollInMs": 4000,
            "doorOpensInSeconds": 14
        }
    ],
```

Fields:

* "name": Can be anything (required)
* "doorPollInMs": Number of milliseconds to wait before polling the doorSensorPin to report if the door is open or closed
* "doorOpensInSeconds": Number of seconds it takes your garage door to open or close (err on the side of being longer than it actually takes)
