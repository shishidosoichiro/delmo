'use strict';

module.exports = Model;

var util = require('util');
var defaultsDeep = require('lodash/defaultsDeep');
var isEqual = require('lodash/isEqual');
var head = require('lodash/head');
var spread = require('lodash/spread');
var cloneDeep = require('lodash/cloneDeep');
var assign = require('lodash/assign');
var bindAll = require('lodash/bindAll');
var pick = require('lodash/pick');
var keys = require('lodash/keys');
var get = require('lodash/fp/get');
var flow = require('flow');

/**
 * helper functions
 */
// slice array
var slice = function(array, begin, end){
  return Array.prototype.slice.call(array, begin, end);
};
var parallel = function(){
  var args = slice(arguments);
  return function(data){
    return Promise.all(args.map(function(f){
      return f.call(this, data);
    }, this));
  };
};
var whether = function(test, trueSide, falseSide){
  if (falseSide === undefined) falseSide = noop

  return function(data){
    var execute = function(res){
      if (res) return trueSide.call(this, data);
      else     return falseSide.call(this, data);
    }.bind(this);
    var res = test(data);
    if (res instanceof Promise) return res.then(execute);
    else return execute(res);
  };
};
var reject = function(message){
  return function(){
    var err = new Error(message);
    err.params = slice(arguments);
    return Promise.reject(err);
  };
};
var resolve = Promise.resolve.bind(Promise);
var noop = function(arg){
  return arg;
};
var log = function(data){
  console.log(data)
  return data;
};

function InvalidStatusException(res){
  var message = `Invalid status. ${res.statusCode}: ${res.statusMessage}`;
  Error.call(this, message);
  this.message = message;
  this.statusCode = res.statusCode;
  this.statusMessage = res.statusMessage;
}
util.inherits(InvalidStatusException, Error);

var demodelize = function(data){
  data = cloneDeep(data);
  if (typeof data === 'function') return;
  if (typeof data === 'string'  ) return data;
  if (typeof data === 'number'  ) return data;
  if (typeof data === 'boolean' ) return data;

  if (data instanceof Array) {
    return data.filter(function(data){
      return typeof data !== 'function'
    })
    .map(demodelize)
  }
  if (typeof data === 'object') {
    var res = {};
    for (var i in data) {
      if (typeof data[i] === 'function') continue;
      res[i] = demodelize(data[i]);
    }
    return res;
  }
  else return data;
}

/**
 * default setting
 */
var defaults = {
  id: function(data){
    return data['id'];
  },
  validate: noop,
  serialize: cloneDeep,
  deserialize: noop,
  response: function(res){
    return res.body;
    if (res.statusCode !== 200) throw new InvalidStatusException(res);
    else return res.body;
  },
  modelize: function(data){
    if (!data) return data;
    return new this(data)
  },
  demodelize: demodelize,
  bind: true,
  req: {
    get: reject('\'req.get\' is not implemented method.'),
    post: reject('\'req.post\' is not implemented method.'),
    put: reject('\'req.put\' is not implemented method.'),
    delete: reject('\'req.delete\' is not implemented method.')
  },
  find: {
    deserialize: function(body){
      if (!(body instanceof Array)) throw new Error('a response is not a array.');
      return Promise.all(body.map(flow(this.options.modelize, this.options.deserialize), this));
    }
  }
};

var methods = {};

/**
 * hasId
 *
 * Boolean = Model.hasId(Object data);
 */
methods.hasId = function(data){
  var options = this.options.hasId;
  return flow(
    options.id,
    // id is a number gt 0, or is a string except ''
    function(id){
      if (id === undefined)                   return false;
      if (typeof id === 'number' && id > 0)   return true;
      if (typeof id === 'string' && id != '') return true;
                                              return false;
    }
  ).call(this, data);
};

/**
 * insert
 *
 * Promise = Model.insert(Object data);
 */
methods.insert = function(data){
  var options = this.options.insert;
  return flow(
    resolve,
    options.validate,
    options.serialize,
    options.demodelize,
    this.req.post,
    options.response
  ).call(this, data);
};

/**
 * update
 *
 * Promise = Model.update(Object data);
 */
methods.update = function(data){
  var options = this.options.update;
  return flow(
    resolve,
    parallel(
      options.id,
      flow(
        options.validate,
        options.serialize,
        options.demodelize
      )
    ),
    spread(this.req.put),
    options.response
  ).call(this, data);
};

/**
 * deleteById
 *
 * Promise = Model.deleteById(Number id);
 * Promise = Model.deleteById(Object data);
 */
methods.deleteById = function(data){
  var options = this.options.deleteById;
  return flow(
    resolve,
    whether(this.hasId, options.id),
    this.req.delete,
    options.response
  ).call(this, data);
};

/**
 * byId
 *
 * Promise = Model.byId(Number id);
 * Promise = Model.byId(Object data);
 */
methods.byId = function(data){
  var options = this.options.byId;
  return flow(
    resolve,
    whether(this.hasId, options.id),
    this.req.get,
    options.response,
    options.modelize,
    options.deserialize
  ).call(this, data);
};

/**
 * find
 *
 * Promise = Model.find(Object query);
 */
methods.find = function(data){
  var options = this.options.find;
  return flow(
    resolve,
    this.req.get,
    options.response,
    options.deserialize
  ).call(this, data);
};

/**
 * save
 *
 * Promise = Model.save(Object data);
 */
methods.save = function(data){
  var options = this.options.update;
  return whether(this.hasId,
    flow(
      resolve,
      options.validate,
      parallel(noop, function(data){
        return this.byId(data)
        .catch(function(err){
          if (err instanceof InvalidStatusException && err.statusCode === 404) return this.insert(data);
          else throw err;
        }.bind(this))
        .then(options.demodelize);
      }),
      whether(spread(isEqual),
        reject('same object.'),
        flow(
          head,
          options.serialize,
          options.demodelize,
          parallel(options.id, noop),
          spread(this.req.put),
          options.response
        )
      )
    ),
    this.insert
  ).call(this, data);
};

var rawMethods = {};

/**
 * get
 *
 * Promise = Model.get(String path, Object query);
 * Promise = Model.get(String path);
 * Promise = Model.get(Object query);
 */
rawMethods.get = function(){
  return this.req.get.apply(this.req, arguments);
};

/**
 * post
 *
 * Promise = Model.post(Object data);
 */
rawMethods.post = function(){
  return this.req.post.apply(this.req, arguments);
};

/**
 * put
 *
 * Promise = Model.put(Object data);
 */
rawMethods.put = function(){
  return this.req.put.apply(this.req, arguments);
};

/**
 * delete
 *
 * Promise = Model.delete(Object data);
 */
rawMethods.delete = function(){
 return this.req.delete.apply(this.req, arguments);
};

var instanceMethods = pick(methods, ['insert', 'update', 'deleteById', 'byId', 'save']);

/**
 * Constructor
 */
function Model(data){
  if (!(this instanceof Model)) return new Model(data);

  assign(this, data);

  // bind
  if (this.Class.options.bind) {
    methods.forEach(function(name){
      this[name] = this[name].bind(this);
    }.bind(this))
  }
}

function Model(data){
  if(!(this instanceof Model)) return new Model(data);

  assign(this, data);
  if (this.constructor.options.bind) 
    bindAll(this, keys(instanceMethods));

}

Model.defaults = defaults;
Model.InvalidStatusException = InvalidStatusException;

/**
 * extend
 *
 * Model = Model.inherits([Function constructor, ]Object options);
 */
Model.inherits = function(constructor, options){
  if (typeof constructor !== 'function') {
    options = constructor;
    constructor = function ExtendedModel(data){
      return Model.call(this, data)
    }
  }
  util.inherits(constructor, Model);
  assign(constructor, Model);

  options = defaultsDeep({}, options || {}, defaults);
  for (var name in methods) {
    options[name] = defaultsDeep({}, options[name] || {}, options);
  }

  constructor.options = options;
  constructor.req = options.req;
  assign(constructor, methods);
  assign(constructor, rawMethods);

  // bind
  if (options.bind)
    bindAll(constructor, keys(methods).concat(keys(rawMethods)));

  return constructor;
}

var options = defaultsDeep({}, defaults);
for (var name in methods) {
  options[name] = defaultsDeep({}, options[name] || {}, options);
}
Model.options = options;
assign(Model, methods);
assign(Model, rawMethods);

/**
 * instance methods
 */
for (var name in instanceMethods) {
  Model.prototype[name] = function(){
    return this.constructor[name](this);
  };
}
