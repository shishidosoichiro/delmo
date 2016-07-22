'use strict';

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var Model = require('../');
var Req = require('req');

var Datastore = require('nedb');
var db = new Datastore();

var express = require('express');
var bodyParser = require('body-parser');
var json = bodyParser.json({ type: 'application/json' });

var router = new express.Router()
.use(json)
.post('/', function(req, res){
  db.insert(req.body, function(err, data){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    res.send(data);
  });
})
.put('/:id', function(req, res){
  db.update({_id: req.params.id}, req.body, {}, function(err, num){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    if (num === 0) return res.status(404).send(`Data Not Found: ${JSON.stringify(req.body)}`);
    res.send(req.body);
  });
})
.delete('/:id', function(req, res){
  db.remove({_id: req.params.id}, {}, function(err, num){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    if (num === 0) return res.status(404).send(`Data Not Found: ${JSON.stringify(req.body)}`);
    res.send();
  });
})
.get('/:id', function(req, res){
  db.findOne({_id: req.params.id}, function(err, data){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    if (!data) return res.status(404).send(`Data Not Found: id = ${req.params.id}`);
    res.send(data);
  });
})
.get('/', function(req, res){
  db.find(req.query, function(err, list){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    res.send(list);
  });
})

var app = express()
.use('/api/user', router)
.listen(3000)

function User(data){
  return Model.call(this, data)
}
Model.inherits(User, {
  req: Req('http://localhost:3000/api/user'),
  id: function(data){
    return data['_id'];
  }
});

describe('actually', function(){
  it('should save, delete, and get from RESTful server.', function(done){
    var user = {username: 'user1', description: 'My name is user1.'};
    User.save(user)
    .then(function(data){
      expect(data._id).not.to.be.empty;
      data.url = 'http://user1.com';
      return data;
    })
    .then(User.save)
    .then(function(data){
      expect(data._id).not.to.be.empty;
      should.equal(data.url, 'http://user1.com');
      user = data;
      return data._id;
    })
    .then(User.byId)
    .then(function(data){
      expect(data._id).not.to.be.empty;
      should.equal(data.url, 'http://user1.com');
      return data;
    })
    .then(User.deleteById)
    .then(function(){
      return user._id;
    })
    .then(User.byId)
    .catch(function(err){
      err.should.be.an.instanceof(Model.InvalidStatusException)
      err.statusCode.should.equal(404)
    })
    .then(done, done)
  })
})
