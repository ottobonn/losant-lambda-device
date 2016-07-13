# losant-lambda-device

An AWS Lambda function to send device attributes to Losant, triggerable from
a Losant workflow.

## Why?

Using Losant for tracking IoT devices, you might find that you need to use a
workflow to update the attributes of a device. For example, you might want to
store some sort of derived property, like a count of a certain type of event, in
the device's attributes on Losant, without putting the burden of reporting that
attribute on the device itself.

## How?

This AWS Lambda function emulates a Losant device using the Losant REST API.
It's designed to be triggered by a Losant workflow. The workflow provides the
Losant device ID of the device you want to emulate, and an object containing
any attributes you wish to report for the device. When the workflow triggers
the handler function, it will look to Losant like your device is reporting
attributes for itself.

### Setup

This Lambda function uses Node version 4.2.\*. Follow these steps to get it
set up on your AWS account:

1. Clone this repository
2. Install the production dependencies using `npm install --production`
3. Add a `config.js` file to the project root. Your file should look like this:

        module.exports = {
          LOSANT_KEY: "your losant key",
          LOSANT_SECRET: "your losant secret"
        };

  Add your own Losant key and secret to the file. Make sure your key is allowed
  to report properties on the device you want to emulate.

4. Archive the project folder's contents in a ZIP file, and upload to AWS
  Lambda. The root-level files like `config.js` and `SetDeviceAttributes.js`
  should be at the top level in the ZIP file.

5. In the AWS Lambda Console, under "Configuration", select:
  * Runtime: Node.js 4.3
  * Handler: `SetDeviceAttributes.handler`

6. Configure or select a role for the Lambda function. It doesn't require any
  special permissions, so you can have AWS create one for you, leaving the
  profile unselected.

7. Test your new Lambda function! See below for the format of the event you can
  use for testing.

8. Create an AWS user for Losant Workflows. The new user needs only the ability
  to execute your new Lambda function.

### Use in Workflow

Now for the good part! In the Losant workflow, include an "AWS Lambda" node, and
enter the key ID and secret key for your new "Losant Workflows" AWS user, in addition to
the region in which you created the Lambda function.

Specify a payload path for the lambda event data. Your payload should contain
an event like the following when the Lambda node is triggered:

    {
      "deviceId": "ID of your Losant device",
      "attributes": {
          "key1": 0,
          "key2": "value2",
          ...
      }
    }

For example, if you specify `lambdaEvent` as the payload path for your AWS Lambda node, then your payload should contain something like the following when entering the node:

    "lambdaEvent": {
      "deviceId": "ID of your Losant device",
      "attributes": {"your": "attributes"}
    }

The `deviceId` property determines which device will seem to report the
specified `attributes`. Use any valid Losant key-value attribute pairs relevant
to your device.

That's it! You should see your device's new attribute reports within seconds of
triggering the AWS Lambda node.

## Development

This module includes unit tests, which require some additional npm modules.
If you want to make changes to this code,

1. Install the development dependencies using `npm install` from the project
  root.
2. Run the unit tests using `npm test`
