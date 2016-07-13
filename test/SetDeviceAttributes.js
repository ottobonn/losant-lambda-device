var chai = require("chai");
var should = chai.should();
chai.use(require("chai-as-promised"));
var sinon = require("sinon");
var RSVP = require("rsvp");
var rewire = require("rewire");

// Set PATH as though this is AWS Lambda
process.env["LAMBDA_TASK_ROOT"] = "lambda-task-root";

var SetDeviceAttributes = rewire("../SetDeviceAttributes");

describe("SetDeviceAttributes", function() {

  var config = {
    LOSANT_KEY: "key",
    LOSANT_SECRET: "secret"
  };

  before("Rewire the module's config object to the testing version", function() {
    SetDeviceAttributes.__set__("config", config);
  });

  describe("Module", function() {

    it("exports a handler function", function() {
      SetDeviceAttributes.handler.should.be.a("function");
    });

    it("exports an AttributeReporter constructor", function() {
      SetDeviceAttributes.AttributeReporter.should.be.a("function");
    });

    it("adds LAMBDA_TASK_ROOT to the PATH", function() {
      should.equal(process.env["PATH"].endsWith(":" + process.env["LAMBDA_TASK_ROOT"]), true);
    });
  });

  describe("AttributeReporter", function() {

    describe("methods", function() {

      var reporter;

      beforeEach("Create a new AttributeReporter", function() {
        reporter = new SetDeviceAttributes.AttributeReporter(config.LOSANT_KEY, config.LOSANT_SECRET);
      });

      describe("#_authenticate", function() {

        var aDStub;
        var token = "token";
        var auth = {"token": token};

        beforeEach("Stub client.auth.authenticateDevice", function() {
          aDStub = sinon.stub(reporter.client.auth, "authenticateDevice")
            .returns(RSVP.resolve(auth));
        });

        it("is a function", function() {
          reporter._authenticate.should.be.a("function");
        });

        it("calls client.auth.authenticateDevice with the correct credentials", function() {
          var deviceId = "id";
          reporter._authenticate(deviceId);
          should.equal(aDStub.calledOnce, true);
          should.equal(aDStub.calledWith({
            credentials: {
              "key": config.LOSANT_KEY,
              "secret": config.LOSANT_SECRET,
              "deviceId": deviceId
            }
          }), true);
        });

        it("resolves to the return value of client.auth.authenticateDevice", function() {
          return reporter._authenticate("id").should.become(auth);
        });

        it("sets the client `accessToken`", function() {
          return reporter._authenticate("id").then(function() {
            return reporter.client.getOption("accessToken").should.equal(token);
          });
        });

      });

      describe("#sendDeviceAttributes", function() {

        var authStub;
        var appId = "app";

        beforeEach("Stub #_authenticate", function() {
          authStub = sinon.stub(reporter, "_authenticate")
            .returns(RSVP.resolve({"applicationId": appId}));
        });

        it("calls #_authenticate with `deviceId`", function() {
          var deviceId = "id";
          reporter.sendDeviceAttributes(deviceId);
          should.equal(authStub.calledOnce, true);
          should.equal(authStub.calledWith(deviceId), true);
        });

        it("calls client.device.sendState with the correct arguments", function() {
          var deviceId = "id";
          var attributes = {"attributeKey": "value"};
          var returnValue = {};
          var sendStateStub = sinon.stub(reporter.client.device, "sendState")
            .returns(returnValue);
          var expectedArgs = {
            "deviceId": deviceId,
            "applicationId": appId,
            "deviceState": {"data": attributes}
          };
          return reporter.sendDeviceAttributes(deviceId, attributes)
            .then(function(result) {
              should.equal(sendStateStub.calledOnce, true);
              should.equal(sendStateStub.calledWith(expectedArgs), true);
              result.should.equal(returnValue);
            });
        });

      });

    });

  });

  describe("handler", function() {

    var event = {
      deviceId: "id",
      attributes: "attributes"
    };

    var AttributeReporterMock;
    var mockInstance = {};
    var revertRewire;

    before("Mock the AttributeReporter", function() {
      AttributeReporterMock = sinon.stub().returns(mockInstance);
      mockInstance.sendDeviceAttributes = sinon.stub();
      revertRewire = SetDeviceAttributes.__set__("AttributeReporter", AttributeReporterMock);
    });

    before("Run the handler", function() {
      SetDeviceAttributes.handler(event);
    });

    after("Unmock the AttributeReporter", function() {
      revertRewire();
    });

    it("creates a new AttributeReporter", function() {
      should.equal(AttributeReporterMock.calledOnce, true);
      should.equal(AttributeReporterMock.calledWith(config.LOSANT_KEY,
        config.LOSANT_SECRET), true);
    });

    it("calls sendDeviceAttributes with the correct parameters", function() {
      should.equal(mockInstance.sendDeviceAttributes.calledOnce, true);
      should.equal(mockInstance.sendDeviceAttributes.calledWith(event.deviceId,
        event.attributes), true);
    });

  });


});
