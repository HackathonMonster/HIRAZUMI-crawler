/*jslint node: true */
"use strict";

/**
 * Module dependencies
 */
var _ = require('lodash'),
  Qiita = require('../models/qiita.model'),
  client = require('cheerio-httpcli');

/**
 * Qiita configuration
 */
var targetHost = 'https://qiita.com',
  searchDir = '/search';

/**
 * [search description]
 * @param  {string}         query    [description]
 * @param  {number}         page     [description]
 * @param  {searchCallback} callback [description]
 */
var search = function(query, page, callback) {
  client.fetch(targetHost + searchDir, {
    page: page,
    q: query,
    sort: 'rel',
    utf8: '%E2%9C%93'
  }).then(function(result) {
    if (result.err)
      return callback(result.err);

    var userPagePath = [],
      userPageSize = result.$('.searchResult').length;

    if (!userPageSize)
      return callback(null, 0, []);

    result.$('.searchResult_itemTitle > a').each(function() {
      userPagePath.push(result.$(this).attr('href'));
    });
    return callback(null, userPageSize, userPagePath);
  });
};
/**
 * @callback searchCallback
 * @param {boolean}
 * @param {string[]}
 */

/**
 * [fetchUserPage description]
 * @param {string}                userPagePath [description]
 * @param {fetchUserPageCallback} callback     [description]
 */
var fetchUserPage = function(userPagePath, callback) {
  client.fetch(targetHost + userPagePath)
    .then(function(result) {
      if (result.err)
        return callback(result.err);

      var $article = result.$('[itemprop=articleBody]'),
        saveFlag = false,
        anchorTmp = '',
        isbn = [];

      $article.find('a').each(function() {
        anchorTmp = result.$(this).attr('href');
        if (anchorTmp && anchorTmp.match(/www\.amazon.+\/\d{9}[\dX]{1}/)) {
          isbn.push(anchorTmp.replace(/^.+\/(\d{9}[\dX]{1}).*$/, "$1"));
          saveFlag = true;
        }
      });

      if (saveFlag) {
        var qiita = new Qiita();
        qiita.datePublished = result.$('[itemprop=datePublished]').attr('datetime');
        qiita.title = result.$('.itemsShowHeaderTitle_title').text();
        qiita.url = targetHost + userPagePath;
        qiita.isbn = _.uniq(isbn);
        return callback(null, qiita);
      }

      return callback(null, null);
    });
};
/**
 * @callback fetchUserPageCallback
 * @param {string} err
 * @param {Qiita}  userPage
 */

/**
 * [isUniqUserPage description]
 * @param {string}                 userPagePath [description]
 * @param {isUniqUserPageCallback} callback     [description]
 */
var isUniqUserPage = function(userPagePath, callback) {
  Qiita.count({
    url: targetHost + userPagePath
  }, function(err, size) {
    if (err)
      return callback(err);
    return callback(null, size);
  });
};

/**
 * [update description]
 * @param  {string}              query    [description]
 * @param  {qiitaUpdateCallback} callback [description]
 */
exports.update = function(query, callback) {
  var fetchSave = function(url) {
      isUniqUserPage(url, function(err, size) {
        if (!err && size === 0)
          fetchUserPage(url, function(err, qiita) {
            if (!err && qiita)
              qiita.save();
          });
      });
    },
    loop = function(page) {
      search(query, page, function(err, userPageSize, userPagePath) {
        if (err)
          return callback(err, page);

        _.each(userPagePath, function(url) {
          setTimeout(fetchSave(url), 500);
        });

        if (10 <= userPageSize)
          setTimeout(loop(++page), 500);
        else
          return callback(null, page);
      });
    };
  loop(1);
};
/**
 * @callback qiitaUpdateCallback
 * @param {string} err
 * @param {number} page
 */
