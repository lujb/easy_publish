easy_publish
============

publish package to registry with one call.

## example ##
```js
var publish = require('easy_publish').publish;

var config = {};
config.username = 'username';
config.password = 'password';
config.email = 'xx@yy.com';
config.registry = 'http://npm.XXX.org/';
config.folder = 'path/to/package'; 

publish(config, function(err) {
	if (err) {
		console.log(err);
		console.log(false);
	} else {
		console.log(true);
	}
});
```
