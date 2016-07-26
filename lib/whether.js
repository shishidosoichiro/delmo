'use strict';

var slice = require('lodash/slice');
var pass = require('./pass');

module.exports = whether;

function whether(test, trueSide, falseSide){
  if (falseSide === undefined) falseSide = pass;

  return function(data){
    var execute = function(res){
      if (res) return trueSide.call(this, data);
      else     return falseSide.call(this, data);
    }.bind(this);
    var res = test(data);
    if (res instanceof Promise) return res.then(execute);
    else return execute(res);
  };
}
