/**
 * Testing asynchronous & nested foreaches with MySQL queries in Node.js
 * @author Janos Vajda
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

var processFeeds = function (callback) {
    connection.query('SELECT * FROM site WHERE active=1', function (err, results) {
        async.forEach(results, function (result, callback) { //iterate each active RSS items
            var feed_id = result.id;
            var feed_url = result.url;
            var category_id=result.category_id;
            feed(feed_url, function (err, articles) { //Collect RSS feeds
                async.forEach(articles, function (article, callback) {
                    console.log(article);
                    var image_url='';
                    var image_title='';
                    
                    if (article.image){
                        image_url=image.url;
                        image_title=image.title;
                    }
                    var title_hash = crypto.createHash('md5').update(article.title).digest('hex'); //generate md5 hash from title
                    var timestamp=moment(new Date()).format("YYYY-MM-DD h:mm:ss A");
                    //Insert feed to database, ignore duplicated items ("hash" field has got unique index)
                    connection.query('INSERT IGNORE INTO feed SET ?', 
                            {title: article.title, 
                             feed_id: feed_id, 
                             url: article.link,
                             content: article.content,
                             hash: title_hash,
                             category_id: category_id,
                             inserted: timestamp,
                             image_title: image_title,
                             image_url: image_url
                            }, 
                         function (err, result) {
                            if (err) throw err;
                            console.log('Feed ID: ', feed_id);
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
    });
};

processFeeds(function (err) {
    console.log('--- Done. ----- DB should be closed.', err);
    connection.end(); //connect database connection, exit
});