var PythonShell = require('python-shell');
var options = {
  scriptPath: __dirname + '/python/',
};
var Service, Characteristic, DoorState; // set in the module.exports, from homebridge

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  DoorState = homebridge.hap.Characteristic.CurrentDoorState;

  homebridge.registerAccessory("homebridge-rasppi-gpio-garagedoor", "RaspPiGPIOGarageDoor", RaspPiGPIOGarageDoorAccessory);
}

function RaspPiGPIOGarageDoorAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.doorPollInMs = config["doorPollInMs"];
  this.doorOpensInSeconds = config["doorOpensInSeconds"];
  log("Door Poll in ms: " + this.doorPollInMs);
  log("Door Opens in seconds: " + this.doorOpensInSeconds);
  this.initService();
  setTimeout(this.monitorDoorState.bind(this), this.doorPollInMs);
}

RaspPiGPIOGarageDoorAccessory.prototype = {

  monitorDoorState: function() {
     this.isClosed(function (err,result) {
      if (err) throw err;
      var currentStatus = result[0];
      var isClosed = (currentStatus == "1");
      if (isClosed != this.wasClosed) {
        this.wasClosed = isClosed;
        var state = isClosed ? DoorState.CLOSED : DoorState.OPEN;       
        this.log("Door state changed to " + (isClosed ? "CLOSED" : "OPEN"));
        if (!this.operating) {
          this.currentDoorState.setValue(state);
          this.targetDoorState.setValue(state,null,false);
        }
      }
      setTimeout(this.monitorDoorState.bind(this), this.doorPollInMs);
    });
     
  },

  initService: function() {
    this.garageDoorOpener = new Service.GarageDoorOpener(this.name,this.name);
    this.currentDoorState = this.garageDoorOpener.getCharacteristic(DoorState);
    this.currentDoorState.on('get', this.getState.bind(this));
    this.targetDoorState = this.garageDoorOpener.getCharacteristic(Characteristic.TargetDoorState);
    this.targetDoorState.on('set', this.setState.bind(this));
    this.targetDoorState.on('get', this.getTargetState.bind(this));
	this.infoService = new Service.AccessoryInformation();
	this.infoService
	.setCharacteristic(Characteristic.Manufacturer, "Opensource Community")
	.setCharacteristic(Characteristic.Model, "RaspPi GPIO GarageDoor")
	.setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");
	
    this.isClosed(function (err,result) {
      if (err) throw err;
      var currentStatus = result[0];
      var isClosed = (currentStatus == "1");
  	  this.currentDoorState.setValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
  	  this.targetDoorState.setValue(isClosed ? DoorState.CLOSED : DoorState.OPEN,null,false);
  	  this.wasClosed = isClosed;
  	  this.operating = false;
  	  setTimeout(this.monitorDoorState.bind(this), this.doorPollInMs);
    });
	
  
    
  },

  getTargetState: function(callback) {
    callback(null, this.targetState);
  },

  isClosed: function(callback) {
    PythonShell.run('door_status.py', options, callback.bind(this));
  },

  setFinalDoorState: function() {
    this.isClosed(function (err,result) {
      if (err) throw err;
      var currentStatus = result[0];
      var isClosed = (currentStatus == "1");
      if ((this.targetState == DoorState.CLOSED && !isClosed) || (this.targetState == DoorState.OPEN && isClosed)) {
        this.log("Was trying to " + (this.targetState == DoorState.CLOSED ? " CLOSE " : " OPEN ") + "the door, but it is still " + (isClosed ? "CLOSED":"OPEN"));
        this.currentDoorState.setValue(DoorState.STOPPED);
        this.targetDoorState.setValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
      } else {
        this.currentDoorState.setValue(this.targetState);
      }
      this.operating = false;
    });
    
  },
  
  setState: function(state, callback, shouldTrigger) {
    if(shouldTrigger !== undefined && shouldTrigger == false){
      this.log("Setting state to " + state);
      this.targetState = state;
    }else{
      this.log("HomeKit setting state to " + state);
      this.targetState = state;
      this.isClosed(function (err,result) {
        if (err) throw err;
        var currentStatus = result[0];
        var isClosed = (currentStatus == "1");
        if ((state == DoorState.OPEN && isClosed) || (state == DoorState.CLOSED && !isClosed)) {
            this.log("Triggering GarageDoor Relay"); 
            if (state == DoorState.OPEN) {
                this.currentDoorState.setValue(DoorState.OPENING);
            } else {
                this.currentDoorState.setValue(DoorState.CLOSING);
            }
            this.operating = true;
            setTimeout(this.setFinalDoorState.bind(this), this.doorOpensInSeconds * 1000);
            PythonShell.run('toggle_garage_door.py', options, function (err) {
              if (err) throw err;
            });
        }

        callback();
      });
    }
    return true;
  },

  getState: function(callback) {
    this.isClosed(function (err,result) {
      if (err) throw err;
      var currentStatus = result[0];
      var isClosed = (currentStatus == "1");
      this.log("GarageDoor is " + (isClosed ? "CLOSED ("+DoorState.CLOSED+")" : "OPEN ("+DoorState.OPEN+")")); 
      callback(null, (isClosed ? DoorState.CLOSED : DoorState.OPEN));
	});
    
  },

  getServices: function() {
    return [this.infoService, this.garageDoorOpener];
  }
};
