/**
 * Module dependencies.
 */
var fs = require('fs'),
  async = require('async'),
  client = require('cheerio-httpcli'),
  readline = require('readline');

var sleep = function(milliSeconds) {
  var startTime = new Date().getTime();
  while (new Date().getTime() < startTime + milliSeconds) {}
};

var fetchQiitaList = function(page) {
  // var baseUrl = 'http://qiita.com/search?page=1&q=%E6%9C%AC&sort=rel&utf8=%E2%9C%93';
  var baseUrl = 'http://qiita.com/search?page=1&q=%E6%9B%B8%E7%B1%8D&sort=rel&utf8=%E2%9C%93';

  console.log(page);

  client.fetch(baseUrl, {
    page: page
  }, function(err, $, res) {
    var articleSize = $('.searchResult').length;

    if (articleSize <= 0) {
      return;
    }
    $('.searchResult_itemTitle > a').each(function() {
      url = $(this).attr('href');
      fs.appendFile('./qiita/url.txt', url + "\n");
    });


    if (10 <= articleSize)
      fetchQiitaList(++page);
  });
};

// fetchQiitaList(1);

var fetchQiita = function() {
  var baseUrl = 'http://qiita.com',
    rs = fs.ReadStream('./qiita/url.txt'),
    rl = readline.createInterface({
      'input': rs,
      'output': {}
    });

  rl.on('line', function(line) {
    client.fetch(baseUrl + line.trim(), {}, function(err, $, res) {
      if (err) {
        console.log(err);
      } else {
        var $article = $('[itemprop=articleBody]'),
          flg = false,
          amazon = [],
          data;
        $article.find('a').each(function() {
          if ($(this).attr('href')) {
            if ($(this).attr('href').match(/www\.amazon/)) {
              amazon.push($(this).attr('href'));
              flg = true;
            }
          }
        });
        if (flg) {
          data = '{"title":"' + $('.itemsShowHeaderTitle_title').text() +
            '","article":"' + $article + '","amazon":"[';
          amazon.forEach(function(ele, idx, arr) {
            data += '"' + ele + '",';
          });
          data.slice(0, -1);
          data += '},';
          fs.appendFile('./qiita/article.json', data);
        }
      }
    });
  });
  rl.resume();
};

// fs.appendFile('article.txt', '[');
// fetchQiita(1);
// fs.appendFile('article.txt', ']');

var fetchCalilList = function(page) {
  // var baseUrl = 'https://calil.jp/category?c=%E3%82%B3%E3%83%B3%E3%83%94%E3%83%A5%E3%83%BC%E3%82%BF&sc=%E4%B8%80%E8%88%AC%E3%83%BB%E5%85%A5%E9%96%80%E6%9B%B8&page=1';
  var baseUrl = 'https://calil.jp/category?c=%E3%82%B3%E3%83%B3%E3%83%94%E3%83%A5%E3%83%BC%E3%82%BF&sc=%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0';

  console.log(page);

  client.fetch(baseUrl, {
    page: page
  }, function(err, $, res) {
    var $article = $('.thumb_cage'),
      articleSize = $article.length;

    if (articleSize <= 0) {
      return;
    }
    $article.each(function() {
      url = $(this).children('a').attr('href');
      fs.appendFile('./calil/url.txt', url + "\n");
    });
    if (10 <= articleSize)
      fetchCalilList(++page);
  });
};

fetchCalilList(1);
