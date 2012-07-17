var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

BoardMapper = function(host, port) {
  this.db= new Db('test', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};


BoardMapper.prototype.getCollection= function(callback) {
  this.db.collection('boards', function(error, board_collection) {
    if( error ) callback(error);
    else callback(null, board_collection);
  });
};

BoardMapper.prototype.findAll = function(callback) {
    this.getCollection(function(error, board_collection) {
      if( error ) callback(error)
      else {
        board_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

BoardMapper.prototype.findById = function(id, callback) {
    this.getCollection(function(error, board_collection) {
      if( error ) callback(error)
      else {
        board_collection.findOne({_id: board_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

BoardMapper.prototype.findByEmail = function(email, callback) {
    this.getCollection(function(error, board_collection) {
      if( error ) callback(error)
      else {
        board_collection.findOne({ "user" : email }, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

BoardMapper.prototype.save = function(boards, callback) {
    this.getCollection(function(error, board_collection) {
      if( error ) callback(error)
      else {
        if( typeof(boards.length)=="undefined")
          boards = [boards];

        for( var i =0;i< boards.length;i++ ) {
          board = boards[i];
          board.created_at = new Date();
        }

        board_collection.insert(boards, function() {
          callback(null, boards);
        });
      }
    });
};

BoardMapper.prototype.update = function(board, callback) {
    this.getCollection(function(error, board_collection) {
      if( error ) callback(error)
      else {
        board_collection.save(board, function() {
          callback(null, board);
        });
      }
    });
};

exports.BoardMapper = BoardMapper;

