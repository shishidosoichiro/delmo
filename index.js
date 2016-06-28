'use strict';

var defaultsDeep = require('lodash/defaultsDeep');
var isEqual = require('lodash/isEqual');
var head = require('lodash/head');
var spread = require('lodash/spread');
var flow = require('flow');

/**
 * helper functions
 */
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
  serialize: noop,
  deserialize: noop,
  response: noop,
  bind: true,
  req: {
    get: reject('\'req.get\' is not impemented method.'),
    post: reject('\'req.post\' is not impemented method.'),
    put: reject('\'req.put\' is not impemented method.'),
    remove: reject('\'req.remove\' is not impemented method.')
  }
};

/**
 * Constructor
 */
var Restful = function(options){
  if (!(this instanceof Restful)) return new Restful(options);

  options = defaultsDeep(options || {}, defaults);

  this.options = options;
  this.req = options.req;
  this.id = options.id;
  this.validate = options.validate;
  this.serialize = options.serialize;
  this.deserialize = options.deserialize;

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
    this.id,
    function(id){
      if (id === undefined)                   return false;
      if (typeof id === 'number' && id > 0)   return true;
      if (typeof id === 'string' && id != '') return true;
                                              return false;
    }
  );

  this._insert = flow(
    resolve,
    this.validate,
    this.serialize,
    this.req.post,
    this.options.response
  );

  this._update = flow(
    resolve,
    parallel(
      this.id,
      flow(
        this.validate,
        this.serialize
      )
    ),
    spread(this.req.put),
    this.options.response
  );

  this._removeById = flow(
    resolve,
    whether(this.hasId,
      this.id
    ),
    this.req.remove,
    this.options.response
  );

  this._byId = flow(
    resolve,
    whether(this.hasId,
      this.id
    ),
    this.req.get,
    this.options.response,
    this.deserialize
  );

  this._find = flow(
    resolve,
    this.req.get,
    this.options.response,
    this.deserialize
  );

  this._save = whether(this.hasId,
    flow(
      resolve,
      this.validate,
      parallel(this.serialize, this.byId),
      whether(spread(isEqual),
        reject('same object.'),
        flow(
          head,
          parallel(this.id, noop),
          spread(this.req.put),
          this.options.response
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
