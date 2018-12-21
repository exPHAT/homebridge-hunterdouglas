// HunterDouglas Platinum Shades plugin for HomeBridge
//
// Remember to add platform to config.json. Example:
// "platforms": [
//     {
//         "platform": "HunterDouglas",
//         "name": "Hunter Douglas",
//         "ip_address": "127.0.0.1",
//         "port": 522
//     }
// ],
//
// If you do not know the IP address of your Bridge, open the "Platinum Shade Controller" app
// and navgate to Settings within the app and look for "Bridge IP".
//
//
// When you attempt to add a device, it will ask for a "PIN code".
// The default code for all HomeBridge accessories is 031-45-154.
//
"use strict";

var hd = require("node-hunterdouglas");

var Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-hunterdouglas", "HunterDouglas", HunterDouglasPlatform);
}


function HunterDouglasPlatform(log, config) {
  this.log = log;
  this.ip_address = config["ip_address"];
  this.port = config["port"];

  if (typeof this.port === "undefined") {
    this.port = 522;
  }
}

function HunterDouglasAccessory(log, device, hd, platform) {
  this.id = UUIDGen.generate(device.name);
  this.name = device.name;
  this.blinds = device.blinds;
  this.hd = hd;
  this.log = log;
  this.platform = platform;

  this.currentPosition = this.blinds[0].position;
  this.targetPosition = this.blinds[0].position;
  this.positionState = 2; // Stopped
}

HunterDouglasPlatform.prototype = {

  lastUpdated: new Date(),

  accessories: function (callback) {
    this.log("Fetching Hunter Douglas Blinds...");
    var that = this;

    let blindController = hd({
      ip: this.ip_address,
      port: this.port
    });

    blindController.setup().then(function (blinds) {
      let foundAccessories = [];

      Object.keys(blinds).forEach(function (key) {
        let blind = blinds[key];

        var accessory = new HunterDouglasAccessory(that.log, blind, blindController, that);
        foundAccessories.push(accessory);
      });

      callback(foundAccessories);
    });
  },

  updateValues: function () {
    let that = this;

    blindController.setup().then(function (blinds) {
      Object.keys(blinds).forEach(function (key) {
        let blind = blinds[key];

        let id = UUIDGen.generate(blind.name);
        let index = that.accessories.map(a => a.id).indexOf(id);
        if (index !== -1) {
          let accessory = that.accessories[index];

          accessory.currentPosition = blind.blinds[0].position;
          accessory.targetPosition = blind.blinds[0].position;
          accessory.positionState = 2; // Stopped
        }
      });
    });
  }
};

HunterDouglasAccessory.prototype = {
  // Convert 0-100 to 0-1
  posToPercent: function (value) {
    value = value / 100
    return value;
  },
  percentToPos: function (value) {
    value = value * 100;
    value = Math.round(value);
    return value;
  },
  getValue: function (characteristic) {
    switch(characteristic.toLowerCase()) {
      case 'pos':
        return this.percentToPos(this.currentPosition);
      case 'target':
        return this.percentToPos(this.targetPosition);
      case 'state':
        return this.positionState;
      default:
        return null;
    }
  },
  // Set blind state
  executeChange: function (characteristic, value, callback) {
    var that = this;

    switch (characteristic.toLowerCase()) {
      case 'pos':
        this.currentPosition = this.posToPercent(value);
        callback();
        break;
      case 'target':
        this.targetPosition = this.posToPercent(value);
        this.hd.move(this.name, this.targetPosition).then(function () {
          setTimeout(function () {
            that.currentPosition = that.targetPosition;
            that.positionState = 2; // Not moving
            callback();
          }, 500);
        });
        break;
      case 'state':
        this.positionState = value;
        callback();
        break;
    }
  },
  // Read blind state
  getState: function (characteristic, callback) {
    callback(null, this.getValue(characteristic));
  },

  // Respond to identify request
  identify: function(callback) {
    this.log(this.name, "Identify");
    callback();
  },

  // Get Services
  getServices: function() {
    var that = this;

    // Use HomeKit types defined in HAP node JS
  	var blindService = new Service.WindowCovering(this.name);

  	blindService
    	.getCharacteristic(Characteristic.CurrentPosition)
    	.on('get', function(callback) { that.getState("pos", callback);})
    	.on('set', function(value, callback) { that.executeChange("pos", value, callback);})
      .value = this.getValue("pos");

    blindService
      .getCharacteristic(Characteristic.PositionState)
      .on('get', function(callback) { that.getState("state", callback);})
      .on('set', function(value, callback) { that.executeChange("state", value, callback);})
      .value = this.getValue("state");

  	blindService
    	.getCharacteristic(Characteristic.TargetPosition)
    	.on('get', function(callback) { that.getState("target", callback);})
    	.on('set', function(value, callback) { that.executeChange("target", value, callback);})
      .value = this.getValue("target");


  	var informationService = new Service.AccessoryInformation();

  	informationService
  		.setCharacteristic(Characteristic.Manufacturer, "HunterDouglas")
  		.setCharacteristic(Characteristic.SerialNumber, this.name);

  	return [informationService, blindService];
  }
};
