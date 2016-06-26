'use strict';

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var _ = require('lodash');

var Restful = require('../');

var stub = {
	post: _.noop,
	put: _.noop,
	get: _.noop,
	remove: _.noop
};

describe('restful', function(){
	var ThrowValidationError = new Restful({
		req: stub,
		validate: function(data){
			throw new Error('validation error');
		}
	});
	var RejectValidationError = new Restful({
		req: stub,
		validate: function(data){
			return Promise.reject(new Error('validation error'));
		}
	});
	var ThrowSerializationError = new Restful({
		req: stub,
		serialize: function(data){
			throw new Error('serialization error');
		}
	});
	var RejectSerializationError = new Restful({
		req: stub,
		serialize: function(data){
			return Promise.reject(new Error('serialization error'));
		}
	});
	var ThrowPostError = new Restful({
		req: _.defaults({post: function(){
			throw new Error('post error');
		}}, stub)
	});
	var RejectPostError = new Restful({
		req: _.defaults({post: function(){
			return Promise.reject(new Error('post error'));
		}}, stub)
	});
	var ThrowPutError = new Restful({
		req: _.defaults({put: function(){
			throw new Error('put error');
		}}, stub)
	});
	var RejectPutError = new Restful({
		req: _.defaults({put: function(){
			return Promise.reject(new Error('put error'));
		}}, stub)
	});

	describe('#insert', function(done){
		it('should validate and serialize and http post', function(){
			var user = {username: 'taro'};
			new Restful({
				req: {
					post: function(data){
						data.should.deep.equal(user);
						return data;
					},
					put: function(){},
					get: function(){},
					remove: function(){}
				},
				validate: function(data){
					data.should.deep.equal(user);
					return data;
				},
				serialize: function(data){
					data.should.deep.equal(user);
					return data;
				}
			})
			.insert(user)
			.then(function(data){
				data.should.deep.equal(user);
				done();
			})
			.catch(done);
		});
		it('should return rejected Promise, If validate method throws a error.', function(done){
			ThrowValidationError.insert({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('validation error');
				done();
			});
		});
		it('should return rejected Promise, If validate method return rejected Promise.', function(done){
			RejectValidationError.insert({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('validation error');
				done();
			});
		});
		it('should return rejected Promise, If serialize method throws a error.', function(done){
			ThrowSerializationError.insert({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('serialization error');
				done();
			});
		});
		it('should return rejected Promise, If serialize method return rejected Promise.', function(done){
			RejectSerializationError.insert({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('serialization error');
				done();
			});
		});
		it('should return rejected Promise, If post method throws a error.', function(done){
			ThrowPostError.insert({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('post error');
				done();
			});
		});
		it('should return rejected Promise, If post method return rejected Promise.', function(done){
			RejectPostError.insert({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('post error');
				done();
			});
		});
	});

	describe('#update', function(){
		it('should return rejected Promise, If validate method throws a error.', function(done){
			ThrowValidationError.update({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('validation error');
				done();
			});
		});
		it('should return rejected Promise, If validate method return rejected Promise.', function(done){
			RejectValidationError.update({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('validation error');
				done();
			});
		});
		it('should return rejected Promise, If serialize method throws a error.', function(done){
			ThrowSerializationError.update({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('serialization error');
				done();
			});
		});
		it('should return rejected Promise, If serialize method return rejected Promise.', function(done){
			RejectSerializationError.update({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('serialization error');
				done();
			});
		});
		it('should return rejected Promise, If put method throws a error.', function(done){
			ThrowPostError.update({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('put error');
				done();
			});
		});
		it('should return rejected Promise, If put method return rejected Promise.', function(done){
			RejectPostError.update({})
			.then(done)
			.catch(function(err){
				err.message.should.equal('put error');
				done();
			});
		});
	});
	describe('#removeById', function(){
		
	});
	describe('#remove', function(){
		
	});
	describe('#byId', function(){
		
	});
	describe('#get', function(){
		
	});
	describe('#find', function(){
		
	});
	describe('#hasId', function(){
		
	});
	describe('#save', function(){
		
	});
	describe('#post', function(){
		
	});
	describe('#put', function(){
		
	});
});
