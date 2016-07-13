# delmo.js
[![Build Status](https://travis-ci.org/shishidosoichiro/delmo.svg?branch=master)](https://travis-ci.org/shishidosoichiro/delmo)
[![Coverage Status](https://coveralls.io/repos/github/shishidosoichiro/delmo/badge.svg?branch=master)](https://coveralls.io/github/shishidosoichiro/delmo?branch=master)

RESTful interface wrapper for http client.


```js
var Model = require('delmo');

var User = Model.inherits({
  req: req.cd('user')
});

User.postSomething = function(data){
  return this.post('something', data)
}
User.getSomething = function(data){
  return this.get('something', data)
}

User.find({username: 'taro'});
User.save({username: 'taro'});
User.byId(1);
User.postSomething('something');
User.getSomething();

var user = new User({username: 'jordan'});
user.save();
```

## Installation

```sh
npm install https://github.com/shishidosoichiro/delmo
```

## Usage

### Model methods

#### Constructor Methods

```js
var User = Model.inherits({
  req: req.cd('user')
});

User.save({username: 'tom'})
.then(console.log.bind(console))

User.byId(1234)
.then(function(user){
  user.username = 'new_name';
  return user
})
.then(User.update)
```

#### Instance Methods

```js
var tom = new User({username: 'tom'});
tom.save()
.then(console.log.bind(console))
```

### Inherit

```js
var User = Model.inherits({
  req: req.cd('user')
});
User.prototype.doSomething = function(){
  ...
};

var user = new User({username: 'tom'});
user.save()

User.save({username: 'tom'})
```

### Customize

```js
var User = Model.inherits({
  req: req.cd('user'),
  deserialize: function(user){
    user.displayName = '@' + user.username;
  },
  serialize: function(user){
    delete user.displayName;
  }
});

var user = new User({username: 'smith'});
user.displayName // -> @smith
```

### Context

```js
var req = Req('htp://example.com/api');
var login = req.cd('login');
login.post({username: 'shishido', password: 'soichiro'});

var Tweet = Model.inherits({
  req: req.cd('tweet'),
});

Tweet.save({tweet: 'hello.'});
// -> post 'hello' to http://example.com/api/tweet with authentication.
```

## API

- Constructor Methods
  - Model Methods
    - save
    - byId
    - find
    - deleteById
    - insert
    - update
  - Inherit Methods
    - inherits
  - Raw HTTP Methods
    - get
    - post
    - put
    - delete
- Instance Methods
  - save
  - byId
  - deleteById
  - insert
  - update


## Memo

```js
var Model = require('delmo');

function User(data){
  return Model.call(this, data);
}
Model.inherits(User, {
  type: {
    username: String,
    id: Number,
    phone: /\d{3}\-\d{4}-\d{4}/
  },
  autoSave: true,
});

// autoSave
var tom = new User({username: 'tom'});
tom.phone = '123-4567-8901';
// -> call tom.save().
tom.phone = 'abcdef';
// -> throw validation error.
// or emit 'error'.
tom.on('error', console.log.bind(console))

// event emitter
User.tail({word: 'jordan'})
.pipe(app.notify)

```
