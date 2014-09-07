var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

UserMapper = function(host, port) {
  this.db= new Db('test', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};


UserMapper.prototype.getCollection= function(callback) {
  this.db.collection('users', function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
};

UserMapper.prototype.findAll = function(callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

UserMapper.prototype.findById = function(id, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.findOne(
            { _id: user_collection.db.bson_serializer.ObjectID.createFromHexString(id) },
            function(error, result) {
                if( error ) callback(error)
                else callback(null, result)
            });
      }
    });
};

UserMapper.prototype.findByEmail = function(email, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.findOne({ "email": email }, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

UserMapper.prototype.save = function(user, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
          user.created_at = new Date();

        user_collection.insert(user, function() {
          callback(null, user);
        });
      }
    });
};

exports.UserMapper = UserMapper;

