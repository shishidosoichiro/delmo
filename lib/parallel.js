'use strict';

var slice = require('lodash/slice');

module.exports = parallel;

function parallel(){
  var args = slice(arguments);
  return function(data){
    return Promise.all(args.map(function(f){
      return f.call(this, data);
    }, this));
  };
}
