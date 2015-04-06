#!/usr/bin/env node

/*jslint node: true */
"use strict";

/**
 * Module dependencies
 */
var app = require('./app/main'),
  config = require('./config'),
  fs = require('fs'),
  mongoose = require('mongoose');

// mongoose connection
var connect = function() {
  var options = {
    server: {
      socketOptions: {
        keepAlive: 1
      }
    }
  };
  mongoose.connect(process.env.mongodbUrl || config.mongodbUrl, options);
};
connect();
mongoose.connection.on('error', console.log);
mongoose.connection.on('connected', console.log);
// mongoose.connection.on('disconnected', connect);
process.on('SIGINT', function() {
  mongoose.connection.close(function() {
    process.exit(0);
  });
});
process.on('exit', function() {
  mongoose.connection.close(function() {
    process.exit(0);
  });
});

// require models
fs.readdirSync(__dirname + '/app/models').forEach(function(file) {
  if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
});

app.start(function(err) {
  if (err)
    process.exit(1);
  else
    process.exit();
});
