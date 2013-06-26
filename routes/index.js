
/*
 * module imports for cruvee api, wine model, snooth api, url and parsing.
 * these modules enable extra functions that i need
 */

  var  url       = require('url')
     , people    = require('../models/people') 
     , campus    = require('../models/campus')
     , setting   = require('../myconfig')
     , everyauth = require('everyauth')
     , request   = require('request')
     , picAlbMod = require('../models/picture')
     , picture   = picAlbMod.picture
     , album     = picAlbMod.album
     , async     = require('async')
     , _         = require('underscore')
     , fb        = require('fbgraph');


/**
  This will find strictly by object Id, and it should only find one 
  This will send to the result in json
  */
exports.peoplefindbyId = function(req, res) { 

  var id = req.params.id;
  people.findbyId( id, function(err,data) {
	if(err) {console.log("ERROR: " + err); return;}
	res.end(JSON.stringify(data, null, '\t'));
  });
}

/* 
  First Name: John
  Last Name: Chou
  Password: xxxxxxxx
  Campus Fellowship: dropdown -- [SCF] 
  
  Contact: 
   Phone Number -- [xxx- xxx - xxxx]
   Email -- [xxxxxx@xxxxx.com]  
  
  
 */
exports.reg_gen = function(req, res) {
  var part = req.body;//url.parse(req.url, true);
   console.log(part);
  var info = part;

  var first = info.first;
  var last = info.last;
  var pass = info.pass;
  var cf = info.campus;
  var phone = info.phone;
  phone = phone.replace(/ /g,'');  

  var email = info.email;
  people.people.addUser(first, last, pass, cf, phone, email, function(err, data) {
    if(err) return res.end(JSON.stringify({error: err}));
    return res.end(JSON.stringify({success: data}));
  });
  
  
}

exports.findAllPeople = function(req, res) { 
  var src = "FINDING ALL PEOPLE";
  people.people.findAll(function(err, data) {
     if(err) return printErrorToRes(data, src, res); 
     return printSuccToRes(data, src, res);
  });
}

exports.findACF = function(req, res) {
  var src = "FINDING A CF";
  var cf = req.params.campus;
  people.findACF(cf, function(err, data) {
     if(err) return printErrorToRes(err, src, res);
     return printSuccToRes(data, src, res);
  });
}

exports.setSCF = function(req, res) {
  var campus = req.params.campus;
  var church = req.params.church;
  var src ="SETTING SCF";
  people.addCF(campus, church, function(err, data) {
    if(err) return printErrorToRes(err, src, res);
    return printSuccToRes(data, src, res);
  });
}

exports.getAllUrlsForPics = function(req, res, cb) {

 // console.log(setting);  
  fb.setAccessToken(setting.user_token);
  //182313125144093  works
  //177917312251010 
  fb.get('182313125144093/?fields=photos,albums', function (err, result) {
    if(err) return console.log(JSON.stringify(err, null, '\t'));
    console.log(JSON.stringify(result, null, '\t'));
    res.end(JSON.stringify(result, null, '\t'));
  });
}

//this 500 limit is hard to fix
var absurl = "http://graph.facebook.com/GROUP_ALBUM_ID/photos?limit=500";
//make the request and return the next
function makeAlbumReq(data, cb) {
  var id = data.id;
  url = absurl.replace('GROUP_ALBUM_ID', id);
  console.log("making request to this url: " +url);
  request.get(url, function(err, resp, body) {
      if(err) return cb(err);
      //save body
      //console.log("body's id" + JSON.stringify(JSON.parse(body).data,null, '\t'));
      async.each(JSON.parse(body).data, picture.addPic, function(err) {
	if(err) return cb({"ERROR : ": err});
        console.log("finished request successfully, with this many saved: " + picAlbMod.numPictures());
        picAlbMod.resetNumPics();
        return cb(null, "finished request successfully, with this many saved: " + picAlbMod.numPictures);
      });
  });
}

exports.requestAllPhotos = function(result, cb) {
  var albumArr = result.albums.data[0].id;
  makeAlbumReq(albumArr, function(err, data) {
     if(err) return cb(err);
     cb(null, data);
  });
}
exports.saveAllAlbums = function(arr, cb) { 
  async.each(arr, album.saveAlbArr, function(err) {
      if(err) return cb({"ERROR:" : err});
      return cb(null, "success");
  });
}

exports.findAllAlbums = function(req, res) {
  var src = "FINDING ALL ALBUMS";
  album.findAll(function(err, data) {
    if(err) return printErrorToRes(err, src, res);
    return printSuccToRes(data, src, res);
  });
}

exports.picFromAlb = function(req, res) {
  var src = "PICKING FROM ALBUMS";
  album.findAll(function(err, data) {
     if(err) return printErrortoRes(err, src, res);
     async.each(data, makeAlbumReq, function(err) {
      	if(err) return printErrorToRes(err, src, res);
	return res.end("worked");  
     });
  });
}

exports.getNumPics = function(req, res) {
  var src = "GETTING ALL PICS";
  picture.findAll( function(err, data) {
    if(err) return printErrorToRes(err, src, res);
    var newArr = _.uniq(data);
    printSuccToRes( newArr, src, res);
    /*async.sortBy(data, function(item, cb) {
       cb(null, item.picId);
    }, function(err, results) {
       if(err) return printErrorToRes(err, src, res);
       for
    }*/
    //return printSuccToRes(newArr, src, res);
  });
}

exports.getPicsLimited = function(req, res) {
  var limit = req.params.limit;
  var index = req.params.index;
  var src = "GETTING PICS LIMITED";
  picture.findLimited(limit, index, function(err, data) {
    if(err) return printErrorToRes(err, src, res);
    return printSuccToRes(data, src, res);
  });
}

exports.getSomeLinks = function(req, res, cb) {
  //get like some links with a skip page
  var limit = req.params.limit;
  var index = req.params.index;
  var src = "GETTING LINKS";
  picture.findLinks(limit, index, function(err, data) {
	cb(err, data);    
  });
}

function printSuccToRes(data, src, res) {  
  res.end(JSON.stringify( {
    result: data,
    source: src
   }));
}
function printErrorToRes(err, src,  res) {  
  res.end(JSON.stringify( {
    error:  err,
    source: src
   }));
}
