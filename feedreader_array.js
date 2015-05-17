/**
 * Testing asynchronous & nested foreaches with MySQL queries in Node.js
 * This one is an simpliest version of my test script. It stores the feed URLs in an array as well as I attached the SQL command too.
 * @author Janos Vajda
 */


/*
   CREATE TABLE IF NOT EXISTS `feed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hash` varchar(70) NOT NULL,
  `url` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `inserted` datetime NOT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hash` (`hash`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 * 
 */

var feed = require("feed-read");
var async = require("async");
var crypto = require('crypto');
var mysql = require('mysql');
var moment=require('moment');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test_database'
});

connection.connect();
var feeds_urls=['http://www.theguardian.com/world/rss', 
                'http://www.theguardian.com/world/hungary/rss'
                ];

var processFeeds = function (callback) {
        async.forEach(feeds_urls, function (feed_url, callback) { //iterate each active RSS items
            feed(feed_url, function (err, articles) { //Collect RSS feeds
                async.forEach(articles, function (article, callback) {
                    console.log(article);
                    var title_hash = crypto.createHash('md5').update(article.title).digest('hex'); //generate md5 hash from title
                    var timestamp=moment(new Date()).format("YYYY-MM-DD h:mm:ss A");
                    //Insert feed to database, ignore duplicated items ("hash" field has got unique index)
                    connection.query('INSERT IGNORE INTO feed SET ?', 
                            {title: article.title, 
                             url: article.link,
                             content: article.content,
                             hash: title_hash,
                             inserted: timestamp
                            }, 
                         function (err, result) {
                            if (err) throw err;
                            console.log('Inserted ID: ', result.insertId);
                            callback();
                        });
                }, function (err) {
                    console.log('Iteration of RSS feeds ended.', err)
                    callback();
                });
            });
        }, function (err) {
            console.log('Sites --END --.', err)
            callback(undefined);
        });
};

processFeeds(function (err) {
    console.log('--- Done. ----- DB should be closed.', err);
    connection.end(); //connect database connection, exit
});