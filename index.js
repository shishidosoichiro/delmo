'use strict';

var _ = require('lodash');
var flow = require('flow');

var slice = function(array, begin, end){
	return Array.prototype.slice.call(array, begin, end);
};
var parallel = function(){
	var args = slice(arguments);
	return function(data){
		return Promise.all(args.map(function(f){
			return f(data);
		}));
	};
};
var whether = function(test, trueSide, falseSide){
	if (falseSide === undefined) falseSide = noop

	return function(data){
		var execute = function(res){
			if (res) return trueSide(data);
			else     return falseSide(data);
		};
		var res = test(data);
		if (res instanceof Promise) return res.then(execute);
		else return execute(res);
	};
};
var reject = function(message){
	return function(params){
		var err = new Error(message);
		err.params = params;
		return Promise.reject(err);
	};
};
var resolve = Promise.resolve.bind(Promise);
var noop = function(arg){
	return arg;
};
var not = function(bool){
	return !bool;
};

var defaults = {
	id: function(data){
		return data['id'];
	},
	validate: noop,
	serialize: noop,
	deserialize: noop,
	bind: true
};

var Restful = function(options){
	if (!(this instanceof Restful)) return new Restful(options);

	options = _.defaults(options, defaults);

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
		this.req.post
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
		_.spread(this.req.put)
	);

	this._removeById = flow(
		resolve,
		this.req.remove
	);

	this._remove = flow(
		resolve,
		this.id,
		this.removeById
	);

	this._byId = flow(
		resolve,
		whether(this.hasId,
			this.id
		),
		this.req.get,
		this.deserialize
	);

	this._get = flow(
		resolve,
		this.req.get
	);

	this._save = whether(this.hasId,
		_.flow(
			resolve,
			this.validate,
			parallel(this.serialize, this.get),
			whether(_.spread(_.isEqual),
				reject('same object.'),
				_.flow(_.head, this.req.put)
			)
		),
		this.insert
	);
};

/**
 * insert
 *
 * var promise = this.insert(object);
 */
Restful.prototype.insert = function(data){
	return this._insert(data);
};

/**
 * update
 *
 * var promise = this.update(object);
 */
Restful.prototype.update = function(data){
	return this._update(data);
};

/**
 * removeById
 *
 * var promise = this.removeById(id);
 */
Restful.prototype.removeById = function(id){
	return this._removeById(id);
};

/**
 * removeById
 *
 * var promise = this.remove(object);
 */
Restful.prototype.remove = function(data){
	return this._remove(data);
};

/**
 * byId
 *
 * var promise = this.byId(object);
 */
Restful.prototype.byId = function(id){
	return this._byId(id);
};

/**
 * get
 *
 * var promise = this.get(path, object);
 * var promise = this.get(path);
 * var promise = this.get(object);
 */
Restful.prototype.get = function(path, query){
	return this.req.get(path, query);
};

/**
 * find
 *
 * var promise = this.find(query);
 */
Restful.prototype.find = function(path, query){
	return this.req.get(path, query);
};

/**
 * hasId
 *
 * var boolean = this.hasId(data);
 */
Restful.prototype.hasId = function(data){
	return this._hasId(data);
};

/**
 * save
 *
 * var promise = this.save(data);
 */
Restful.prototype.save = function(data){
	return this._save(data);
};
//Restful.prototype.save = function(data){
//	if (this.hasId(data)) {
//		return this.get(data)
//		.then(function(old){
//			if (_.isEqual(old, data)) return Promise.reject('same object.');
//			return this.update(data);
//		})
//	}
//	else {
//		return this.insert(data);
//	}
//};

/**
 * post
 *
 * var promise = this.insert(object);
 */
Restful.prototype.post = function(path, data){
	return this.req.post(path, data);
};

/**
 * put
 *
 * var promise = this.insert(object);
 */
Restful.prototype.put = function(path, data){
	return this.req.put(path, data);
};

module.exports = Restful;
