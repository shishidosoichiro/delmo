'use strict';

var slice = require('lodash/slice');

module.exports = error;

function error(message){
  return function(){
    var err = new Error(message);
    err.params = slice(arguments);
    return Promise.reject(err);
  };
};
