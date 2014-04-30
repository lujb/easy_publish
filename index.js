var RegClient = require('npm-registry-client');
var sha = require('sha');


var conf = {};
conf.tarball = '.npm/mytest/0.0.2/package.tgz';
conf.username = 'lu.jingbo';
conf.password = '******';
conf.email = 'lujingboo@gmail.com';
conf.registry = 'http://npm.rytjs.org:5288/';


var shasum = sha.get(conf.tarball, function(err, shasum){
    if (err){
        throw(err)
    } else{
        return shasum
    }
});

conf.data = {
    name: 'mytest',
    version: '0.0.2',
    description: '',
    main: 'index.js',
    scripts: { test: 'echo "Error: no test specified" && exit 1' },
    author: '',
    license: 'ISC',
    readme: 'ERROR: No README data found!',
    _id: 'mytest@0.0.2',
    dist: { shasum: shasum },
    //_from: '.',
    //_npmVersion: '1.3.21',
    _npmUser: { name: conf.username, email: conf.email }
};


publish(conf);


function publish(data) {
    var conf = data;
    conf.cache = 'blahblah';
    conf.get = function(k){return conf[k]};
    conf.set = function(k,v){conf[k]=v};
    conf.del = function(k){delete conf[k]};
    registry = new RegClient(conf);
    login(registry, function(err, auth) {
        if (err) {
            console.log('login:', err);
            return false;
        } else {
            registry.publish(conf.data, conf.tarball, function(err){
                if (err) {
                    console.log('publish:', err);
                    return false;
                } else {
                    return true;
                }
            });
        }
    });
}

function login(registry, cb) {
    var username = registry.conf.username;
    var password = registry.conf.password;
    var email = registry.conf.email;
    registry.adduser(username, password, email, function(err) {
        if (err) {
            if (cb) cb(err);
        } else {
            if (cb) cb(err, registry.conf._auth);
        }
    })
}
