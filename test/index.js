'use strict';

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var _ = require('lodash');

var Model = require('../');

var success = function(arg){
  return {statusCode: 200, body: arg};
};

var stub = {
  post: success,
  put: success,
  get: success,
  delete: success
};

describe('delmo', function(){
  var ThrowValidationError = Model.inherits({
    req: stub,
    validate: function(data){
      throw new Error('validation error');
    }
  });
  var RejectValidationError = Model.inherits({
    req: stub,
    validate: function(data){
      return Promise.reject(new Error('validation error'));
    }
  });
  var ThrowSerializationError = Model.inherits({
    req: stub,
    serialize: function(data){
      throw new Error('serialization error');
    }
  });
  var RejectSerializationError = Model.inherits({
    req: stub,
    serialize: function(data){
      return Promise.reject(new Error('serialization error'));
    }
  });
  var ThrowDeserializationError = Model.inherits({
    req: _.defaults({get: function(data){
      return {statusCode: 200, body: {id: data}}
    }}, stub),
    deserialize: function(data){
      throw new Error('deserialization error');
    }
  });
  var RejectDeserializationError = Model.inherits({
    req: _.defaults({get: function(data){
      return {statusCode: 200, body: {id: data}}
    }}, stub),
    deserialize: function(data){
      return Promise.reject(new Error('deserialization error'));
    }
  });
  var ThrowPostError = Model.inherits({
    req: _.defaults({post: function(){
      throw new Error('post error');
    }}, stub)
  });
  var RejectPostError = Model.inherits({
    req: _.defaults({post: function(){
      return Promise.reject(new Error('post error'));
    }}, stub)
  });
  var ThrowPutError = Model.inherits({
    req: _.defaults({
      put: function(){
        throw new Error('put error');
      },
      get: function(data){
        return {statusCode: 200, body: {id: data, name: 'no name'}}
      }
    }, stub)
  });
  var RejectPutError = Model.inherits({
    req: _.defaults({
      put: function(){
        return Promise.reject(new Error('put error'));
      },
      get: function(data){
        return {statusCode: 200, body: {id: data, name: 'no name'}}
      }
    }, stub)
  });
  var ThrowRemoveError = Model.inherits({
    req: _.defaults({delete: function(){
      throw new Error('delete error');
    }}, stub)
  });
  var RejectRemoveError = Model.inherits({
    req: _.defaults({delete: function(){
      return Promise.reject(new Error('delete error'));
    }}, stub)
  });
  var ThrowGetError = Model.inherits({
    req: _.defaults({get: function(){
      throw new Error('get error');
    }}, stub)
  });
  var RejectGetError = Model.inherits({
    req: _.defaults({get: function(){
      return Promise.reject(new Error('get error'));
    }}, stub)
  });
  var ThrowIdError = Model.inherits({
    req: stub,
    id: function(){
      throw new Error('id error');
    }
  });
  var RejectIdError = Model.inherits({
    req: stub,
    id: function(){
      return Promise.reject(new Error('id error'));
    }
  });
  var NotFound = Model.inherits({
    req: _.defaults({get: function(id){
      return Promise.reject(new Error('not found'));
    }}, stub)
  });
  it('should return a instance', function(){
    Model().should.be.instanceof(Model);
  });

  describe('#insert', function(){
    it('should validate, serialize and execute req.post', function(done){
      var user = {username: 'taro'};
      Model.inherits({
        req: _.defaults({post: function(data){
          data.should.deep.equal(user);
          return {statusCode: 200, body: data};
        }}, stub),
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
      .catch(function(err){
        err.message.should.equal('post error');
        done();
      });
    });
    it('should return rejected Promise, If post method return rejected Promise.', function(done){
      RejectPostError.insert({})
      .catch(function(err){
        err.message.should.equal('post error');
        done();
      });
    });
  });

  describe('#update', function(){
    it('should validate, serialize and execute req.put', function(done){
      var user = {id: 12345, username: 'taro'};
      Model.inherits({
        req: _.defaults({put: function(id, data){
          id.should.deep.equal(user.id);
          data.should.deep.equal(user);
          return {statusCode: 200, body: data};
        }}, stub),
        validate: function(data){
          data.should.deep.equal(user);
          return data;
        },
        serialize: function(data){
          data.should.deep.equal(user);
          return data;
        }
      })
      .update(user)
      .then(function(data){
        data.should.deep.equal(user);
        done();
      })
      .catch(done);
    });
    it('should return rejected Promise, If id method throws a error.', function(done){
      ThrowIdError.update({id: 12345, username: 'taro'})
      .catch(function(err){
        err.message.should.equal('id error');
        done();
      });
    });
    it('should return rejected Promise, If id method return rejected Promise.', function(done){
      RejectIdError.update({id: 12345, username: 'taro'})
      .catch(function(err){
        err.message.should.equal('id error');
        done();
      });
    });
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
      ThrowPutError.update({})
      .catch(function(err){
        err.message.should.equal('put error');
        done();
      });
    });
    it('should return rejected Promise, If put method return rejected Promise.', function(done){
      RejectPutError.update({})
      .catch(function(err){
        err.message.should.equal('put error');
        done();
      });
    });
  });
  describe('#deleteById(Number)', function(){
    it('should execute req.delete.', function(done){
      var user = {id: 12345, username: 'taro'};
      Model.inherits({
        req: _.defaults({delete: function(id){
          return {statusCode: 200, body: user};
        }}, stub)
      })
      .deleteById(user.id)
      .then(function(data){
        data.should.deep.equal(user);
        done();
      })
      .catch(done);
    });
    it('should return rejected Promise, If delete method throws a error.', function(done){
      ThrowRemoveError.deleteById(12345)
      .catch(function(err){
        err.message.should.equal('delete error');
        done();
      });
    });
    it('should return rejected Promise, If delete method return rejected Promise.', function(done){
      RejectRemoveError.deleteById(12345)
      .catch(function(err){
        err.message.should.equal('delete error');
        done();
      });
    });
  });
  describe('#deleteById(Object)', function(){
    it('should execute req.delete.', function(done){
      var user = {id: 12345, username: 'taro'};
      Model.inherits({
        req: _.defaults({delete: function(id){
          return {statusCode: 200, body: user};
        }}, stub)
      })
      .deleteById(user)
      .then(function(data){
        data.should.deep.equal(user);
        done();
      })
      .catch(done);
    });
  });
  describe('#byId', function(){
    it('should execute req.get and deserialize', function(done){
      Model.inherits({
        req: _.defaults({get: function(id){
          return {statusCode: 200, body: {id: id, username: 'taro'}};
        }}, stub),
        deserialize: function(data){
          data.deserialized = true;
          return data;
        }
      })
      .byId(123456)
      .then(function(data){
        data.id.should.deep.equal(123456);
        should.equal(data.deserialized, true);
        done();
      })
      .catch(done);
    });
    it('should execute req.get.', function(done){
      Model.inherits({
        req: _.defaults({get: function(id){
          return {statusCode: 200, body: {id: id, username: 'taro'}};
        }}, stub)
      })
      .byId({id: 123456})
      .then(function(data){
        data.id.should.deep.equal(123456);
        done();
      })
      .catch(done);
    });
    it('should return rejected Promise, If id method throws a error.', function(done){
      ThrowIdError.byId(1234567)
      .catch(function(err){
        err.message.should.equal('id error');
        done();
      });
    });
    it('should return rejected Promise, If id method return rejected Promise.', function(done){
      RejectIdError.byId(1234567)
      .catch(function(err){
        err.message.should.equal('id error');
        done();
      });
    });
    it('should return rejected Promise, If get method throws a error.', function(done){
      ThrowGetError.byId(1234567)
      .catch(function(err){
        err.message.should.equal('get error');
        done();
      });
    });
    it('should return rejected Promise, If get method return rejected Promise.', function(done){
      RejectGetError.byId(1234567)
      .catch(function(err){
        err.message.should.equal('get error');
        done();
      });
    });
    it('should return rejected Promise, If deserialize method throws a error.', function(done){
      ThrowDeserializationError.byId(1234567)
      .then(done)
      .catch(function(err){
        err.message.should.equal('deserialization error');
        done();
      });
    });
    it('should return rejected Promise, If deserialize method return rejected Promise.', function(done){
      RejectDeserializationError.byId(1234567)
      .then(done)
      .catch(function(err){
        err.message.should.equal('deserialization error');
        done();
      });
    });
  });
  describe('#find', function(){
    var NotArrayError = Model.inherits({
      req: _.defaults({get: function(id){
        return {statusCode: 200, body: {id: id, username: 'taro'}};
      }}, stub)
    });
    var ThrowDeserializationError = Model.inherits({
      req: _.defaults({get: function(id){
        return {statusCode: 200, body: [{id: id, username: 'taro'}]};
      }}, stub),
      deserialize: function(data){
        throw new Error('deserialization error');
      }
    });
    var RejectDeserializationError = Model.inherits({
      req: _.defaults({get: function(id){
        return {statusCode: 200, body: [{id: id, username: 'taro'}]};
      }}, stub),
      deserialize: function(data){
        return Promise.reject(new Error('deserialization error'));
      }
    });
    it('should execute req.get.', function(done){
      var data = {word: 'abcd'}
      var list = [{name: 'abcd'}, {name: 'abdce'}]
      Model.inherits({
        req: _.defaults({get: function(query){
          query.should.deep.equal(data)
          return {statusCode: 200, body: list};
        }}, stub)
      })
      .find(data)
      .then(function(result){
        result.map(Model.options.demodelize).should.deep.equal(list);
        done();
      })
      .catch(done);
    });
    it('should return rejected Promise, If get method throws a error.', function(done){
      ThrowGetError.find({q: 'taro'})
      .catch(function(err){
        err.message.should.equal('get error');
        done();
      });
    });
    it('should return rejected Promise, If get method return rejected Promise.', function(done){
      RejectGetError.find({q: 'taro'})
      .catch(function(err){
        err.message.should.equal('get error');
        done();
      });
    });
    it('should return rejected Promise, If get method return res that does not have an array.', function(done){
      NotArrayError.find({q: 'taro'})
      .then(function(data){
      	console.log(data)
      })
      .catch(function(err){
        err.message.should.equal('a response is not a array.');
        done();
      });
    });
    it('should return rejected Promise, If deserialize method throws a error.', function(done){
      ThrowDeserializationError.find({q: 'taro'})
      .then(done)
      .catch(function(err){
        err.message.should.equal('deserialization error');
        done();
      });
    });
    it('should return rejected Promise, If deserialize method return rejected Promise.', function(done){
      RejectDeserializationError.find({q: 'taro'})
      .then(done)
      .catch(function(err){
        err.message.should.equal('deserialization error');
        done();
      });
    });
  });
  describe('#hasId', function(){
    it('should execute id method.', function(){
      var HasId = Model.inherits({
        req: stub,
        id: function(data){
          return data['userId'];
        }
      })
      HasId.hasId({userId: 123456}).should.equal(true);
      HasId.hasId({userId: 'string'}).should.equal(true);
      HasId.hasId({userId: 0}).should.equal(false);
      HasId.hasId({userId: -1}).should.equal(false);
      HasId.hasId({userId: ''}).should.equal(false);
      HasId.hasId({userId: null}).should.equal(false);
      HasId.hasId({userId: {}}).should.equal(false);
      HasId.hasId({id: 123456}).should.equal(false);
    });
    it('should throws a error, If id method throws a error.', function(done){
      try {
        var res = ThrowIdError.hasId(1234567)
      }
      catch (err) {
        err.message.should.equal('id error');
        done();
      }
    });
    it('should return rejected Promise, If id method return rejected Promise.', function(done){
      RejectIdError.hasId(1234567)
      .catch(function(err){
        err.message.should.equal('id error');
        done();
      });
    });
  });
  describe('#save', function(){
    it('should return rejected Promise, If validate method throws a error.', function(done){
      ThrowValidationError.save({})
      .then(done)
      .catch(function(err){
        err.message.should.equal('validation error');
        done();
      });
    });
    it('should return rejected Promise, If validate method return rejected Promise.', function(done){
      RejectValidationError.save({})
      .then(done)
      .catch(function(err){
        err.message.should.equal('validation error');
        done();
      });
    });
    it('should return rejected Promise, If serialize method throws a error.', function(done){
      ThrowSerializationError.save({})
      .then(done)
      .catch(function(err){
        err.message.should.equal('serialization error');
        done();
      });
    });
    it('should return rejected Promise, If serialize method return rejected Promise.', function(done){
      RejectSerializationError.save({})
      .then(done)
      .catch(function(err){
        err.message.should.equal('serialization error');
        done();
      });
    });
    it('should return rejected Promise, If post method throws a error.', function(done){
      ThrowPostError.save({})
      .catch(function(err){
        err.message.should.equal('post error');
        done();
      });
    });
    it('should return rejected Promise, If post method return rejected Promise.', function(done){
      RejectPostError.save({})
      .catch(function(err){
        err.message.should.equal('post error');
        done();
      });
    });
    it('should return rejected Promise, If get method throws a error.', function(done){
      ThrowGetError.save({id: 12345})
      .catch(function(err){
        err.message.should.equal('get error');
        done();
      });
    });
    it('should return rejected Promise, If get method return rejected Promise.', function(done){
      RejectGetError.save({id: 12345})
      .catch(function(err){
        err.message.should.equal('get error');
        done();
      });
    });
    it('should return rejected Promise, If put method throws a error.', function(done){
      ThrowPutError.save({id: 12345})
      .catch(function(err){
        err.message.should.equal('put error');
        done();
      });
    });
    it('should return rejected Promise, If put method return rejected Promise.', function(done){
      RejectPutError.save({id: 12345})
      .catch(function(err){
        err.message.should.equal('put error');
        done();
      });
    });
    it('should execute put, If data is found and different.', function(done){
      Model.inherits({
        req: _.defaults({
          get: function(id){
            id.should.equal(2468);
            return {statusCode: 200, body: {id: id, username:'a_different_name'}};
          },
          put: function(id, data){
            id.should.equal(2468);
            data.id.should.equal(2468);
            data.username.should.equal('a_name');
            return {statusCode: 200, body: data};
          }
        }, stub)
      })
      .save({id: 2468, username: 'a_name'})
      .then(function(data){
        data.id.should.equal(2468);
        data.username.should.equal('a_name');
        done();
      })
      .catch(done);
    });
    it('should reject with a error, If data is found but same.', function(done){
      Model.inherits({
        req: _.defaults({
          get: function(id){
            id.should.equal(2468);
            return {statusCode: 200, body: {id: 2468, username: 'a_name'}};
          }
        }, stub)
      })
      .save({id: 2468, username: 'a_name'})
      .catch(function(err){
        err.message.should.equal('same object.');
        done();
      })
    });
  });
  describe('#get', function(){
    
  });
  describe('#post', function(){
    
  });
  describe('#put', function(){
    
  });
});
