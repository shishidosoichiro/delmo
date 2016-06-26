# restful
[![Build Status](https://travis-ci.org/shishidosoichiro/restful.svg?branch=master)](https://travis-ci.org/shishidosoichiro/restful)
[![Coverage Status](https://coveralls.io/repos/github/shishidosoichiro/restful/badge.svg?branch=master)](https://coveralls.io/github/shishidosoichiro/restful?branch=master)

RESTful interface wrapper for http client app.


```js
var User = Restful({
	req: options.req.cd('user')
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
```



```js
gulp.task('user', ['login'], function(){
	return gulp.src('user/*.json')
	.pipe(data(
		String,
		JSON.parse,
		User.save
	))
	.pipe(log)
	//.catch(errorLog)
});
```
