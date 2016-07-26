'use strict';

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var Model = require('../');
var Req = require('req');

var map = require('event-stream').map;

var crypto = require('crypto');
var Datastore = require('nedb');
var db = new Datastore();
db.ensureIndex({ fieldName: 'id', unique: true });
function uid (len) {
  return crypto.randomBytes(Math.ceil(Math.max(8, len * 2)))
    .toString('base64')
    .replace(/[+\/]/g, '')
    .slice(0, len);
}

var http = require('http');

var express = require('express');
var bodyParser = require('body-parser');
var json = bodyParser.json({ type: 'application/json' });

var ws = require('ws');
var WebSocketServer = ws.Server;

var server = http.createServer();

var router = new express.Router()
.use(json)
.post('/', function(req, res){
  if (req.body && !req.body.id) req.body.id = uid(16);
  db.insert(req.body, function(err, data){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    wss.inserted.broadcast(data)
    wss.saved.broadcast(data)
    res.send(data);
  });
})
.put('/:id', function(req, res){
  db.update({id: req.params.id}, req.body, {}, function(err, num){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    if (num === 0) return res.status(404).send(`Data Not Found: ${JSON.stringify(req.body)}`);
    wss.updated.broadcast(req.body)
    wss.saved.broadcast(req.body)
    res.send(req.body);
  });
})
.delete('/:id', function(req, res){
  db.remove({id: req.params.id}, {}, function(err, num){
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (err) return res.status(500).send(err);
    if (num === 0) return res.status(404).send(`Data Not Found: ${JSON.stringify(req.body)}`);
    wss.deleted.broadcast(req.params.id);
    res.send();
  });
})
.get('/:id', function(req, res){
  db.findOne({id: req.params.id}, function(err, data){
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

var path = '/api/user';
var app = express()
.use(path, router)

var wss = {
  main: new WebSocketServer({server: server, path: path}),
  inserted: new WebSocketServer({server: server, path: path + '/inserted'}),
  updated: new WebSocketServer({server: server, path: path + '/updated'}),
  saved: new WebSocketServer({server: server, path: path + '/saved'}),
  deleted: new WebSocketServer({server: server, path: path + '/deleted'})
}

function assignBroadcast(wss) {
  wss.broadcast = function broadcast(data) {
    data = JSON.stringify(data);
    wss.clients.forEach(function each(client) {
      client.send(data);
    });
  };
};
assignBroadcast(wss.main);
assignBroadcast(wss.inserted);
assignBroadcast(wss.updated);
assignBroadcast(wss.saved);
assignBroadcast(wss.deleted);

server.on('request', app)
.listen(3000);

function User(data){
  return Model.call(this, data)
}
Model.inherits(User, {
  req: Req('http://localhost:3000/api/user'),
  realtime: true
});

describe('actually', function(){
  it('should save, delete, and get from RESTful server.', function(done){
    var user = {username: 'user1', description: 'My name is user1.'};
    User.save(user)
    .then(function(data){
      expect(data.id).not.to.be.empty;
      data.url = 'http://user1.com';
      return data;
    })
    .then(User.save)
    .then(function(data){
      expect(data.id).not.to.be.empty;
      should.equal(data.url, 'http://user1.com');
      user = data;
      return data.id;
    })
    .then(User.byId)
    .then(function(data){
      expect(data.id).not.to.be.empty;
      should.equal(data.url, 'http://user1.com');
      return data;
    })
    .then(User.deleteById)
    .then(function(){
      return user.id;
    })
    .then(User.byId)
    .catch(function(err){
      err.should.be.an.instanceof(Model.InvalidStatusException)
      err.statusCode.should.equal(404)
    })
    .then(done, done)
  })

  describe('#on(\'inserted\')', function(){
    it('should receive inserted data.', function(done){
      var user2 = {username: 'user2', description: 'My name is user2.'};
      User.once('inserted', function(data){
        should.equal(data.username, user2.username);
        should.equal(data.description, user2.description);
        done();
      })
      User.insert(user2)
    })
  })
  describe('#on(\'updated\')', function(){
    it('should receive updated data.', function(done){
      var user2 = {username: 'user2', description: 'My name is user2.'};
      User.once('updated', function(data){
        should.equal(data.username, user2.username);
        should.equal(data.description, user2.description);
        should.equal(data.url, 'http://user2.com');
        done();
      })
      User.insert(user2)
      .then(function(data){
        data.url = 'http://user2.com';
        return data;
      })
      .then(User.save)
    })
  })

  describe('#inserted', function(){
  	var shouldEqualUser = function(a, b){
      should.equal(a.username, b.username);
      should.equal(a.description, b.description);
  	};
    it('should receive inserted data.', function(done){
    	var users = [
    		{username: 'user1#inserted', description: 'My name is user1#inserted.'},
				{username: 'user2#inserted', description: 'My name is user2#inserted.'}
    	];
      var counter = 0;
      User.inserted()
      .pipe(map(function(data, next){
      	console.log(data)
      	shouldEqualUser(users[counter], data);
      	counter++;
      	if (counter === users.length) done();
      }))
      User.insert(users[0]);
      User.insert(users[1]);
    })
  })
})
