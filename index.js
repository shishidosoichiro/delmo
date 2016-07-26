'use strict';

module.exports = Model;

var util = require('util');
var debug = util.debuglog('delmo');
var EventEmitter = require('events');
var defaultsDeep = require('lodash/defaultsDeep');
var cloneDeep = require('lodash/cloneDeep');
var assign = require('lodash/assign');
var bindAll = require('lodash/bindAll');
var pick = require('lodash/pick');
var slice = require('lodash/slice');
var keys = require('lodash/keys');
var get = require('lodash/fp/get');
var flow = require('flow');
var WebSocket = require('ws/lib/WebSocket');

var pass = require('./lib/pass');
var error = require('./lib/error');
var log = require('./lib/log');
var demodelize = require('./lib/demodelize');
var InvalidStatusException = require('./lib/invalid-status-exception');

var realtimeMethods = require('./lib/realtime');
var rawMethods = require('./lib/raw');
var methods = require('./lib/methods');

var setWebSocket = function(Constructor, name){
  var url = Constructor.req.url.cd(name).href;
  var ws = WebSocket(url);
  ws.on('open', debug.bind(null, `open WebSocket. url: ${url}`));
  ws.on('message', function(string, flags){
    var data = JSON.parse(string);
    Constructor.emit(name, data);
  })
}

/**
 * default setting
 */
var defaults = {
  bind: true,
  realtime: false,
  id: get('id'),
  validate: pass,
  serialize: cloneDeep,
  deserialize: pass,
  response: function(res){
    if (/^2\d\d$/.test(res.statusCode)) return res.body;
    throw new InvalidStatusException(res);
  },
  modelize: function(data){
    if (!data) return data;
    return new this(data)
  },
  demodelize: demodelize,
  req: {
    get: error('\'req.get\' is not implemented method.'),
    post: error('\'req.post\' is not implemented method.'),
    put: error('\'req.put\' is not implemented method.'),
    delete: error('\'req.delete\' is not implemented method.')
  },
  find: {
    deserialize: function(body){
      if (!(body instanceof Array)) throw new Error('a response is not a array.');
      return Promise.all(body.map(flow(this.options.modelize, this.options.deserialize), this));
    }
  }
};

var instanceMethods = pick(methods, ['insert', 'update', 'deleteById', 'byId', 'save']);

/**
 * Constructor
 */
function Model(data){
  if(!(this instanceof Model)) return new Model(data);
  if (!data) data = {};

  EventEmitter.call(this);
  assign(this, data);
  if (this.constructor.options.bind)
    bindAll(this, keys(instanceMethods));

}
util.inherits(Model, EventEmitter);
EventEmitter.call(Model);
assign(Model, EventEmitter.prototype);
Model.defaults = defaults;
Model.InvalidStatusException = InvalidStatusException;

/**
 * extend
 *
 * Model = Model.inherits([Function constructor, ]Object options);
 */
Model.inherits = function(Constructor, options){
  var Super = this;
  if (typeof Constructor !== 'function') {
    options = Constructor;
    Constructor = function ExtendedModel(data){
      return Super.call(this, data)
    }
  }
  util.inherits(Constructor, Super);
  assign(Constructor, Super);

  options = defaultsDeep({}, options || {}, Super.rawOptions);
  Constructor.rawOptions = cloneDeep(options);
  for (var name in methods) {
    options[name] = defaultsDeep({}, options[name] || {}, options);
  }

  Constructor.options = options;
  Constructor.req = options.req;
  assign(Constructor, methods);
  assign(Constructor, rawMethods);
  assign(Constructor, realtimeMethods);

  // bind
  if (options.bind)
    bindAll(Constructor, keys(methods).concat(keys(rawMethods)));

  // realtime
  if (options.realtime) {
    if (options.realtime === true || options.realtime.inserted) setWebSocket(Constructor, 'inserted');
    if (options.realtime === true || options.realtime.updated) setWebSocket(Constructor, 'updated');
    if (options.realtime === true || options.realtime.saved) setWebSocket(Constructor, 'saved');
    if (options.realtime === true || options.realtime.deleted) setWebSocket(Constructor, 'deleted');
  }

  return Constructor;
}

var options = defaultsDeep({}, defaults);
Model.rawOptions = cloneDeep(options);
for (var name in methods) {
  options[name] = defaultsDeep({}, options[name] || {}, options);
}
Model.options = options;
assign(Model, methods);
assign(Model, rawMethods);
assign(Model, realtimeMethods);

/**
 * instance methods
 */
for (var name in instanceMethods) {
  Model.prototype[name] = function(){
    return this.constructor[name](this);
  };
}
