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
