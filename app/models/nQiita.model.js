/*jslint node: true */
"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var nQiitaSchema = new Schema({
  url: {
    type: String,
    require: true,
    unique: true
  },
  dateRegister: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'nQiita'
});

module.exports = mongoose.model('nQiita', nQiitaSchema);
