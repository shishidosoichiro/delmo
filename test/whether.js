'use strict';

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var whether = require('../lib/whether');

function equalABCD(data){
  return data === 'ABCD';
}
function promiseOfEqualABCD(data){
  return Promise.resolve(data === 'ABCD');
}
function returnPromiseWithEqualABCD(data){
  return Promise.resolve(data === 'ABCD');
}
function throwString(){
  throw 'error'
}
function returnRejectedPromise(){
  return Promise.reject('error');
}
function wrongSide(){
  done('wrong side');
}
function concatEFGH(data){
  return data.concat('EFGH');
}

describe('whether', function(){
  it('should execute true side function, If a test function returns true.', function(){
    var result = whether(equalABCD, concatEFGH, wrongSide)('ABCD');
    should.equal(result, 'ABCDEFGH');
  });
  it('should execute false side function, If a test function returns false.', function(){
    var result = whether(equalABCD, wrongSide, concatEFGH)('WXYZ');
    should.equal(result, 'WXYZEFGH');
  });
  it('should execute true side function, If a test function returns a promise of true.', function(done){
    var promise = whether(returnPromiseWithEqualABCD, concatEFGH, wrongSide)('ABCD');
    promise.then(function(result){
      should.equal(result, 'ABCDEFGH');
    })
    .then(done, done)
  });
  it('should execute false side function, If a test function returns a promise of false.', function(done){
    var promise = whether(returnPromiseWithEqualABCD, wrongSide, concatEFGH)('WXYZ');
    promise.then(function(result){
      should.equal(result, 'WXYZEFGH');
    })
    .then(done, done)
  });
  it('should throw a error, If a test function throw its error.', function(){
    try {
      var result = whether(throwString, wrongSide, wrongSide)('ABCD');
    }
    catch (e){
      e.should.equal('error');
    }
  });
  it('should reject, If a test function returns a rejected promise.', function(done){
    var promise = whether(returnRejectedPromise, wrongSide, wrongSide)('WXYZ');
    promise.then(function(result){
      should.fail()
    })
    .catch(function(e){
      e.should.equal('error');
      done()
    })
  });
});
