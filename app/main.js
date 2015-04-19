/*jslint node: true */
"use strict";

/**
 * Module dependencies
 */
var _ = require('lodash'),
  async = require('async'),
  config = require('../config'),
  debug = require('debug')('crawler'),
  qiita = require('./controllers/qiita.controller');

exports.start = function(callback) {
  var qiitaUpdate = function(queryIdx) {
    if (config.qiitaSearchWord.length <= queryIdx)
      return callback();
    qiita.update(config.qiitaSearchWord[queryIdx], function(err, page) {
      if (err) {
        console.log(err);
        return callback(err);
      }
      debug(page);
      qiitaUpdate(++queryIdx);
    });
  };
  qiitaUpdate(0);
};
