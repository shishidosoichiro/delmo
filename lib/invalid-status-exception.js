'use strict';

var util = require('util');

module.exports = InvalidStatusException;

function InvalidStatusException(res){
  var message = `Invalid status. ${res.statusCode}: ${res.statusMessage}`;
  Error.call(this, message);
  this.message = message;
  this.statusCode = res.statusCode;
  this.statusMessage = res.statusMessage;
  this.response = res;
}
util.inherits(InvalidStatusException, Error);

