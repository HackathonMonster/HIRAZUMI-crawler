/*jslint node: true */
"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var QiitaSchema = new Schema({
  datePublished: Date,
  title: String,
  url: {
    type: String,
    require: true,
    unique: true
  },
  isbn: [String],
  dateRegister: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'Qiita'
});

module.exports = mongoose.model('Qiita', QiitaSchema);
