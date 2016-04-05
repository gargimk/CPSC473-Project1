var jsonServer = require('json-server')
var bodyParser = require("body-parser");
var express = require('express');
var path = require('path');
var Twitter = require('twitter');

var app = express(); //require to post the tweet to twitter

//create the client for twitter to post the tweet
 var client = new Twitter({
        consumer_key: 'S2869yTRZhlJKvDo1T79iSvFR',
        consumer_secret: 'HJpcNm6sIetiuZRtzpCQb5XuZwSW6orQo8UO5Iyh2VoYzYaR8t',
        access_token_key: '711730133019680769-AdrIKRiWQgz15nEcyRQjVxQMZmfdgh0',
        access_token_secret: 'iHr1ufUNxhPA9imvvVWpMmtZ51IAzqehh7rDlpVXTv7zb'
    });

// Returns an Express server
var server = jsonServer.create() //require for json server

app.use(express.static(path.join(__dirname, 'public')))

// Set default middlewares (logger, static, cors and no-cache)
server.use(jsonServer.defaults());

// Adding custom routes for tweetApp application
app.get('/tweetapp', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
});

// Returns an Express router
var router = jsonServer.router('db.json');
server.use(router);

app.use(bodyParser.json());
//to post the tweet on twitter
app.post('/postTweet',function (req,res) {
    var tweet = req.body.status;
    var flag=true;
    client.post('statuses/update', {status: tweet },  function(error, tweet, response){
        if(error){
            flag=false;
        }
        else{
            flag=true;
            console.log(tweet);  // Tweet body. 
            console.log(response);  // Raw response object. 
        }

    });
    if(flag)
    {
        res.json({ msg: 'success' });
    }
    else{
        res.json({ msg: 'failure' });
    }
    
});
app.listen(7012);
server.listen(3000);