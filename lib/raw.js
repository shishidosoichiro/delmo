'use strict';

var rawMethods = module.exports = {};

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
