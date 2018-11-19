'use strict';

var express = require('express');
var mongo = require('mongodb');
require('dotenv').config();

try{
  var mongoose = require('mongoose');
} catch (e) {
  console.log(e);
}

const shortid = require('shortid');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
var dns = require('dns');

var validUrl = require('valid-url');
  

// Basic Configuration 
var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("MongoDB successfully connected :)");
});

var urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: {type: String, required: true}
});

var urlShort = mongoose.model('urlShort', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());


// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

function checkValidity(url){
  const httpRegex = /^(http|https)(:\/\/)/;
  const wwwRegex = /(www.)/;
  const slashRegex = /\/.*/

  url = url.replace(httpRegex, '')
                  .replace(wwwRegex, '')
                  .replace(slashRegex, '');
  
  console.log("URLL", url);

  var ans = true;
  dns.resolve(url,(err, data) => {
      if(err){
        console.log("here");
        return false;
      }else{
        return true;
      }
  });
}

app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new",(req, res) => {
  var longurl = req.body.url;
  var entry = new urlShort({original_url: longurl, short_url: shortid.generate()});

    if (!validUrl.isUri(longurl)){
      res.send({error: "Invalid URL"});
    
    }else{ 

  urlShort.findOne({original_url: longurl},(err, data) => {
    if(err){
      res.send(err);
    }
    if(data){
      res.send({message: "Shortened URL already present", short_url: data.short_url, original_url: data.original_url});
    }else{
      entry.save(function(err, data){
        if(err){
          console.log(err);
          res.send(err);
        }else{
          res.send({original_url: longurl, short_url: '/api/shorturl/'+data.short_url});
        }
      });
    }
  
  });
    }

});

app.get('/api/shorturl/:id',(req, res) => {
  var id = req.params.id;
  urlShort.findOne({short_url: id},(err, data) => {
    if(err){
      console.log(err);
      res.json({error: err});
    }else{
      res.redirect(data.original_url);
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});