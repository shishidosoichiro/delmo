'use strict';

var spread = require('lodash/spread');
var isEqual = require('lodash/isEqual');
var head = require('lodash/head');
var flow = require('flow');

var parallel = require('./parallel');
var whether = require('./whether');
var pass = require('./pass');
var error = require('./error');
var InvalidStatusException = require('./invalid-status-exception');
var resolve = Promise.resolve.bind(Promise);

var methods = module.exports = {};

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
      parallel(pass, function(data){
        return this.byId(data)
        .catch(function(err){
          if (err instanceof InvalidStatusException && err.statusCode === 404) return this.insert(data);
          else throw err;
        }.bind(this))
        .then(options.demodelize);
      }),
      whether(spread(isEqual),
        error('same object.'),
        flow(
          head,
          options.serialize,
          options.demodelize,
          parallel(options.id, pass),
          spread(this.req.put),
          options.response
        )
      )
    ),
    this.insert
  ).call(this, data);
};

