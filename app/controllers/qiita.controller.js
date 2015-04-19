/*jslint node: true */
"use strict";

/**
 * Module dependencies
 */
var _ = require('lodash'),
  Qiita = require('../models/qiita.model'),
  nQiita = require('../models/nQiita.model'),
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
    var userPagePath = [],
      userPageSize = result.$('.searchResult').length;

    if (!userPageSize)
      return callback(null, 0, []);

    result.$('.searchResult_itemTitle > a').each(function() {
      userPagePath.push(result.$(this).attr('href'));
    });
    return callback(null, userPageSize, userPagePath);
  }).catch(function(err) {
    return callback(err);
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
        qiita.author = {
          name: userPagePath.replace(/^\/(.+)\/items\/\w+$/, "$1"),
          imageUrl: result.$('.itemsShowHeaderTitle_authorIcon').attr('src')
        };
        qiita.description = result.$('meta[name=description]').attr('content');
        qiita.isbn = _.uniq(isbn);
        return callback(null, qiita);
      }

      return callback(null, null);
    }).catch(function(err) {
      return callback(err);
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
    else if (size === 0) {
      nQiita.count({
        url: targetHost + userPagePath
      }, function(err, size) {
        if (err)
          return callback(err);
        else if (size === 0)
          return callback(null, true);
        else
          return callback(null, false);
      });
    } else
      return callback(null, false);
  });
};

/**
 * [update description]
 * @param  {string}              query    [description]
 * @param  {qiitaUpdateCallback} callback [description]
 */
exports.update = function(query, callback) {
  var sleepTime = 0,
    sleep = function(func, time) {
      sleepTime += time;
      setTimeout(func, sleepTime * 100);
    },
    fetchSave = function(url, callback) {
      fetchUserPage(url, function(err, qiita) {
        if (err)
          return callback(err);
        else if (qiita) {
          console.log(url);
          qiita.save();
          return callback(null);
        } else {
          var nqiita = new nQiita();
          nqiita.url = targetHost + url;
          nqiita.save();
        }
      });
    },
    loop = function(page) {
      console.log(page);
      search(query, page, function(err, userPageSize, userPagePath) {
        if (err)
          return callback(err, page);

        _.each(userPagePath, function(url) {
          isUniqUserPage(url, function(err, uniq) {
            if (err)
              console.log(err);
            else if (uniq)
              sleep(function() {
                fetchSave(url, function(err) {
                  if (err)
                    return callback(err);
                });
              }, 5);
          });
        });

        if (10 <= userPageSize)
          sleep(function() {
            loop(++page);
          }, 5);
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
