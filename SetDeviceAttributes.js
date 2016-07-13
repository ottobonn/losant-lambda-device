if (process.env["LAMBDA_TASK_ROOT"]) {
  process.env["PATH"] += ":" + process.env["LAMBDA_TASK_ROOT"];
}

var losant = require("losant-rest");
var config = require("./config");

function handler(event) {
  new AttributeReporter(config.LOSANT_KEY, config.LOSANT_SECRET)
    .sendDeviceAttributes(event.deviceId, event.attributes);
}

var AttributeReporter = function(LOSANT_KEY, LOSANT_SECRET) {
  this.client = losant.createClient();
  this.LOSANT_KEY = LOSANT_KEY;
  this.LOSANT_SECRET = LOSANT_SECRET;
};

AttributeReporter.prototype.sendDeviceAttributes = function(deviceId, attributes) {
  var self = this;
  return this._authenticate(deviceId).then(function(auth) {
    var appId = auth.applicationId;
    return self.client.device.sendState({
      "deviceId": deviceId,
      "applicationId": appId,
      "deviceState": {"data": attributes}
    });
  });
};

AttributeReporter.prototype._authenticate = function(deviceId) {
  var self = this;
  return this.client.auth.authenticateDevice({
    credentials: {
      "key": this.LOSANT_KEY,
      "secret": this.LOSANT_SECRET,
      "deviceId": deviceId
    }
  }).then(function(auth) {
    self.client.setOption("accessToken", auth.token);
    return auth;
  });
};

exports.AttributeReporter = AttributeReporter;
exports.handler = handler;
