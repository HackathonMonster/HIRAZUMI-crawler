/*jslint node: true */
'use strict';
/**
 * Module dependencies
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var db = mongoose.createConnection(process.env.MONGODB_URI, function(err, res) {
  if (err) {
    console.log('Error connected: ' + process.env.MONGODB_URI + ' - ' + err);
  } else {
    console.log('Success connected: ' + process.env.MONGODB_URI);
  }
});

/**
 * Qiita Schema
 */
var QiitaSchema = new Schema({
  title: String,
  url: {
    type: String,
    unique: true
  },
  isbn: [String]
});

exports.Qiita = mongoose.model('Qiita', QiitaSchema);
