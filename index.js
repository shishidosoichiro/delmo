'use strict';

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
  response: get('body'),
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
      return body.map(this.options.modelize).map(this.options.deserialize)
    }
  }
};

/**
 * Constructor
 */
var Restful = function(options){
  if (!(this instanceof Restful)) return new Restful(options);

  options = defaultsDeep(options || {}, defaults);

  this.options = options;
  var req = this.req = options.req;
  var id = options.id;
  var validate = options.validate;
  var serialize = options.serialize;
  var deserialize = options.deserialize;
  var response = options.response;
  var modelize = options.modelize = options.modelize || this.modelize.bind(this);
  var demodelize = options.demodelize = options.demodelize || this.demodelize.bind(this);

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

  // id is a number gt 0, or is a string except ''
  this._hasId = flow(
    id,
    function(id){
      if (id === undefined)                   return false;
      if (typeof id === 'number' && id > 0)   return true;
      if (typeof id === 'string' && id != '') return true;
                                              return false;
    }
  );

  this._insert = flow(
    resolve,
    validate,
    serialize,
    demodelize,
    req.post,
    response
  );

  this._update = flow(
    resolve,
    parallel(
      id,
      flow(
        validate,
        serialize,
        demodelize
      )
    ),
    spread(req.put),
    response
  );

  this._removeById = flow(
    resolve,
    whether(this.hasId,
      id
    ),
    req.remove,
    response
  );

  this._byId = flow(
    resolve,
    whether(this.hasId,
      id
    ),
    req.get,
    response,
    modelize,
    deserialize
  );

  this._find = flow(
    resolve,
    req.get,
    response,
    options.find.deserialize,
    Promise.all.bind(Promise)
  );

  this._save = whether(this.hasId,
    flow(
      resolve,
      validate,
      parallel(noop, flow(this.byId, demodelize)),
      whether(spread(isEqual),
        reject('same object.'),
        flow(
          head,
          serialize,
          demodelize,
          parallel(id, noop),
          spread(req.put),
          response
        )
      )
    ),
    this.insert
  );
};

/**
 * hasId
 *
 * Boolean = restful.hasId(Object data);
 */
Restful.prototype.hasId = function(data){
  return this._hasId(data);
};

/**
 * modelize
 *
 */
Restful.prototype.modelize = function(data){
  if (!data) return data;
  data.insert = this.insert.bind(this, data);
  data.update = this.update.bind(this, data);
  data.remove = this.removeById.bind(this, data);
  data.save = this.save.bind(this, data);
  return data;
};

Restful.prototype.demodelize = function(data){
  if (!data) return data;
  delete data.insert;
  delete data.update;
  delete data.remove;
  delete data.save;
  return data;
};

/**
 * insert
 *
 * Promise = restful.insert(Object data);
 */
Restful.prototype.insert = function(data){
  return this._insert(data);
};

/**
 * update
 *
 * Promise = restful.update(Object data);
 */
Restful.prototype.update = function(data){
  return this._update(data);
};

/**
 * removeById
 *
 * Promise = restful.removeById(Number id);
 * Promise = restful.removeById(Object data);
 */
Restful.prototype.removeById = function(id){
  return this._removeById(id);
};

/**
 * byId
 *
 * Promise = restful.byId(Number id);
 * Promise = restful.byId(Object data);
 */
Restful.prototype.byId = function(id){
  return this._byId(id);
};

/**
 * find
 *
 * Promise = restful.find(Object query);
 */
Restful.prototype.find = function(query){
  return this._find(query);
};

/**
 * save
 *
 * Promise = restful.save(Object data);
 */
Restful.prototype.save = function(data){
  return this._save(data);
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

module.exports = Restful;
