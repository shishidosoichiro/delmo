'use strict';

var util = require('util');
var defaultsDeep = require('lodash/defaultsDeep');
var isEqual = require('lodash/isEqual');
var head = require('lodash/head');
var spread = require('lodash/spread');
var cloneDeep = require('lodash/cloneDeep');
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
    data.insert = this.insert.bind(this, data);
    data.update = this.update.bind(this, data);
    data.remove = this.removeById.bind(this, data);
    data.save = this.save.bind(this, data);
    return data;
  },
  demodelize: function(data){
    if (!data) return data;
    delete data.insert;
    delete data.update;
    delete data.remove;
    delete data.save;
    return data;
  },
  bind: true,
  req: {
    get: reject('\'req.get\' is not implemented method.'),
    post: reject('\'req.post\' is not implemented method.'),
    put: reject('\'req.put\' is not implemented method.'),
    remove: reject('\'req.remove\' is not implemented method.')
  },
  find: {
    deserialize: function(body){
      if (!(body instanceof Array)) throw new Error('a response is not a array.');
      return Promise.all(body.map(flow(this.options.modelize, this.options.deserialize), this));
    }
  }
};

/**
 * Constructor
 */
function Restful(options){
  if (!(this instanceof Restful)) return new Restful(options);

  options = defaultsDeep({}, options || {}, defaults);

  this.options = options;
  this.req = options.req;

  // bind
  if (options.bind) {
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.removeById = this.removeById.bind(this);
    this.remove = this.remove.bind(this);
    this.byId = this.byId.bind(this);
    this.get = this.get.bind(this);
    this.find = this.find.bind(this);
    this.hasId = this.hasId.bind(this);
    this.save = this.save.bind(this);
  }
};

/**
 * hasId
 *
 * Boolean = restful.hasId(Object data);
 */
Restful.prototype.hasId = function(data){
  var options = defaultsDeep({}, this.options.hasId || {}, this.options);
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
 * Promise = restful.insert(Object data);
 */
Restful.prototype.insert = function(data){
  var options = defaultsDeep({}, this.options.insert || {}, this.options);
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
 * Promise = restful.update(Object data);
 */
Restful.prototype.update = function(data){
  var options = defaultsDeep({}, this.options.update || {}, this.options);
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
 * removeById
 *
 * Promise = restful.removeById(Number id);
 * Promise = restful.removeById(Object data);
 */
Restful.prototype.removeById = function(data){
  var options = defaultsDeep({}, this.options.removeById || {}, this.options);
  return flow(
    resolve,
    whether(this.hasId, options.id),
    this.req.remove,
    options.response
  ).call(this, data);
};

/**
 * byId
 *
 * Promise = restful.byId(Number id);
 * Promise = restful.byId(Object data);
 */
Restful.prototype.byId = function(data){
  var options = defaultsDeep({}, this.options.byId || {}, this.options);
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
 * Promise = restful.find(Object query);
 */
Restful.prototype.find = function(data){
  var options = defaultsDeep({}, this.options.find || {}, this.options);
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
 * Promise = restful.save(Object data);
 */
Restful.prototype.save = function(data){
  var options = defaultsDeep({}, this.options.update || {}, this.options);
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

/**
 * get
 *
 * Promise = restful.get(String path, Object query);
 * Promise = restful.get(String path);
 * Promise = restful.get(Object query);
 */
Restful.prototype.get = function(){
  return this.req.get.apply(this.req, arguments);
};

/**
 * post
 *
 * Promise = restful.post(Object data);
 */
Restful.prototype.post = function(){
  return this.req.post.apply(this.req, arguments);
};

/**
 * put
 *
 * Promise = restful.put(Object data);
 */
Restful.prototype.put = function(){
  return this.req.put.apply(this.req, arguments);
};

/**
 * remove
 *
 * Promise = restful.remove(Object data);
 */
Restful.prototype.remove = function(){
 return this.req.remove.apply(this.req, arguments);
};

Restful.defaults = defaults;
Restful.InvalidStatusException = InvalidStatusException;
module.exports = Restful;
