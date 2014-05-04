var fs = require('fs');
var sha = require('sha');
var tar = require('tar');
var zlib = require('zlib');
var path = require('path');
var log = require('npmlog');
var fstream = require('fstream');
var Packer = require('fstream-npm');
var RegClient = require('npm-registry-client');


function publish(config, cb) {
	var conf = config;

	if (!cb) {
		cb = function (err) {
			if (err) console.log(err);
		}
	}

	// get package.json
	var app = require(path.join(config.folder, 'package.json'));
	var id = app.name + '@' + app.version;
	conf.data = app;
	conf.data.id = id;
	conf.data.dist = {};
	conf.data._npmUser = {
			name:conf.username,
			email:conf.email
	};

	var base_folder = path.dirname(config.folder);
	conf.tarball = path.join(base_folder, 'package.tgz');

	// pack specified app folder
	pack(config.folder, conf.tarball, config.filter, function (err) {
		if (err) {
			log.error("pack", "failed to pack:" + conf.tarball);
			cb(err);
		} else {
			// get shasum
			conf.data.dist.shasum = sha.getSync(conf.tarball, function(err, shasum) {
				if (err) {
					log.error("sha", "sha error " + conf.tarball);
					cb(err);
				} else {
					return shasum
				}
			});

			conf.cache = 'blahblah'; //requied
			conf.get = function(k) { return conf[k] };
			conf.set = function(k,v) { conf[k] = v };
			conf.del = function(k) { delete conf[k] };

			registry = new RegClient(conf);

			// try to login registry
			login(registry, function(err, auth) {
				if (err) {
					log.error('login error ', registry);
					cb(err);
				} else {
					// try to publish package
					registry.publish(conf.data, conf.tarball, function(err) {
						if (err) {
							log.error('publish error', conf.data);
							cb(err);
						} else {
						// ok, cleanup
							fs.unlink(conf.tarball, function (err) {
								if (err) {
									log.error('clean error ', conf.tarball);
									cb(err);
								} else {
									cb();
								}
							}); //end unlink
						}
					}); //end publish
				}
			}); //end login
		}
	}); //end pack
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

function pack (folder, tarball, filter, cb) {
	var config = { path: folder, type: "Directory", Directory: true };

	if (typeof filter === 'function') {
		config.filter = filter;
	}

	new Packer(config)
	  // .on("package", function (p) {
	  // })
		.on("error", function (err) {
			if (err) log.error("tar pack", "Error reading " + folder)
			return cb(err)
		})

		.pipe(tar.Pack())
		.on("error", function (err) {
			if (err) log.error("tar.pack", "tar creation error", tarball)
			cb(err)
		})
		.pipe(zlib.Gzip())
		.on("error", function (err) {
			if (err) log.error("tar.pack", "gzip error "+tarball)
			cb(err)
		})
		.pipe(fstream.Writer({ type: "File", path: tarball }))
		.on("error", function (err) {
			if (err) log.error("tar.pack", "Could not write "+tarball)
			cb(err)
		})
		.on("close", cb);
	return true;
}


// expose
module.exports.publish = publish;
