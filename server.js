//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 8081)
    , mongoose = require('mongoose')
    , people = require('./models/people')
    , routes = require('./routes')
    , graph = require('fbgraph')
    , conf = require('./myconfig')
    , everyauth = require('everyauth')
    , gcm = require('node-gcm');
//setup fb
//everyauth.debug= true;
var usersById = {};
var usersByFbId = {};
var nextUserId = 0;

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}

 everyauth.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });

everyauth
  .facebook
    .appId(conf.client_id)
    .appSecret(conf.client_secret)
    .scope('user_groups, friends_groups, user_photos, friends_photos')
    .fields('id,name,email,picture')
    .handleAuthCallbackError( function (req, res) {
        //console.log("asdf");
     // If a user denies your app, Facebook will redirect the user to
     // /auth/facebook/callback?error_reason=user_denied&error=access_denied&error_description=The+user+denied+your+request.
     // This configurable route handler defines how you want to respond to
     // that.
     // If you do not configure this, everyauth renders a default fallback
     // view notifying the user that their authentication failed and why.
    })
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
       graph.setAccessToken(accessToken);        
       //182313125144093
       graph.get('182313125144093/?fields=photos,albums', function (err, result) {
	  //return console.log(result.albums.data);
          //save all albums
         if(err) return console.log("there's an error: " + JSON.stringify(err, null, '\t'));
         //console.log(result.photos.paging.next);
          routes.saveAllAlbums(result.albums.data, function(err, data) {
		if(err) return console.log(JSON.stringify(err, null, '\t'));
                return console.log(JSON.stringify(data, null, '\t'));
          });
         /*routes.requestAllPhotos(result, function(err, data) {
            if(err) console.log("error in requesting: " + err);
            else console.log("the succcess data: " + data);
         });*/
       });
       console.log("printing access token: " + accessToken + " with others: " + JSON.stringify(accessTokenExtra, null, '\t'));
      return usersByFbId[fbUserMetadata.id] ||
        (usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
    })
    .redirectPath('/');



//Setup Express
var server = express();

var uristring = process.env.MONGOHQ_URL ||
                process.env.MONGOLAB_URI ||
                'mongodb://localhost/scfapp';

//mongoose conneecting string logging to the out
mongoose.connect(uristring, function(err, res) {
  if(err) {
     console.log("ERROR occurred connecting to :" + uristring + '. ' + err);
  } else {
     console.log("MONGO connected! here: " + uristring);

  }
});

//the db connection on error or opened 
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
  console.log("MONGO open!");
});
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(everyauth.middleware());
//    server.use(server.router);
    //server.use(everyauth.middleware());
});

//setup the errors
/*server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.jade', { locals: { 
                  title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});*/
server.listen( port);

//Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function(socket){
  console.log('Client Connected');
  socket.on('message', function(data){
    socket.broadcast.emit('server_message',data);
    socket.emit('server_message',data);
  });
  socket.on('disconnect', function(){
    console.log('Client Disconnected.');
  });
});

//setup node-gcm
var message = new gcm.Message({
  collapseKey: 'demo',
  timeToLive: 20,
  data: {
     key1: 'COOL MESSAGE'
  }
});

var sender = new gcm.Sender('AIzaSyDR-0G4LCM-Wc5Y80Kngt598SqdePVNTcY');


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('fb.jade');/*
  res.render('index.jade', {
    locals : { 
              title : 'Your Page Title'
             ,description: 'Your Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
	     ,regid: ''
            }
  });*/
});

/***************************************
SCF Pics
*************************************/
server.get('/pictures', function(req, res) {
 var src= "getting pictures";
 routes.getAllUrlsForPics(req, res, function(err, data) { 
    if(err) return printErrorToRes(err, src, res);
    return printSuccToRes(data, src, res);
 });
});

server.get('/admin/pic', function(req, res) {
  res.render('fb.jade', {});
});

server.get('/admin/allalbums', routes.findAllAlbums);

server.get('/admin/picFromAlb', routes.picFromAlb);
server.get('/admin/getAllPics', routes.getNumPics);
server.get('/admin/getPicLimited/:index/:limit', routes.getPicsLimited);
server.get('/admin/getLinks/:index/:limit',/* routes.getSomeLinks*/ function(req, res) {
  routes.getSomeLinks(req, res, function(err, data) {
    if(err) var pic = "picture cannot be found";
    else {
      var picArr = data;
      //console.log(JSON.stringify(picArr[0].images[4].source, null, '\t'));
      res.render('login2.jade', {
	title: "WHOO",
	pic1: 'http://sphotos-f.ak.fbcdn.net/hphotos-ak-ash3/s600x600/181914_182314721810600_1704828_n.jpg',
	description: "weee",
	stuff: "asdfasdfasdfasdf",
	author: 'Your Name',
	analyticssiteid: 'XXXXXXX',
	regid: '',
	arr: picArr
      });
    }
  });
});

/** This is solely for tring out the sender on all the users
  *
  */
server.get('/ajax/trial', function(req, res) {
  var src = "TRIAL";
  console.log("received, now sending req");
  people.findCF(function(err, data) {
     //2 retries
     result= [data.regid];
     sender.send(message, result, 2, function (err, result) {
      if(err)
      {
	  console.log("error: " + err);
	  printErrorToRes(err, src, res);
	  return;
      }
      else {
        var sucMesg = "It worked!";
       	printSuccToRes(sucMesg, src, res);
      }
    });
  });
});
server.get('/register/:regid', function(req,res){
  var src = "GET REG ID";
  var registration = req.params.regid;
  console.log("this regid: " + registration);
  res.setHeader('Content-Type', 'application/json');
  tempId = [registration];
  //send the gcm message - params = message-literal, regid array, no. of retries, callback
  sender.sendNoRetry(message, tempId, function (err, result) {
	console.log(result);
    if(err)
    {
	console.log("error: " + err);
	printErrorToRes(err, src, res);
	return;
    } else if(result.success === 0) { 
	var Err = result.results[0].error;
        console.log("error: " + Err );
        return printErrorToRes(Err, src, res);

    }
    //save it to the peopleSchema
    people.saveData(registration, function(err, data){
	if(err) return printErrorToRes(err, src, res);
    	console.log("success: " + data);
	printSuccToRes(data, src, res);
    });
  });
});

//a website register and an update on the website
/*required: 
First,
Last,
Password,
Campus Fellowship,
Phone, 
Email

ex: /web/register/query?first=John&last=Chou&pass=choucalate&cf=SCF&phone=4084821911&email=jychou@ucsd.edu
*/
server.get('/login', function(req, res) {
  res.render('login.jade', {
    locals : { 
              title : 'Your Page Title'
             ,description: 'Your Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
	     ,regid: ''
            }
  });
});
server.post('/login', function(req, res) {
  res.render('admin.jade', {
    locals : { 
              title : 'Your Page Title'
             ,description: 'Your Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
	     ,regid: ''
            }
  });
});


server.get('/web/register/:info', routes.reg_gen);
server.post('/web/register', routes.reg_gen);
server.get('/allpeople', routes.findAllPeople);
server.get('/findCF/:campus/:church', routes.findACF);
server.get('/admin/setSCF/:campus/:church', routes.setSCF);

server.get('/sendReq/:cf', function(req, res) {
//use https://github.com/ncb000gt/node-cron
// and http://www.w3schools.com/jsref/jsref_obj_date.asp

   var cmpsfel = req.params.cf;
   //result must be in array format for the sender to iterate
   campus.getCF(cmpsfel, function( err, result) {
     if(err)
     {
	return console.log("error: " + err); 
     }
     //2 retries
     sender.send(message, result, 2, function (err, result) {
      if(err)
      {
	  console.log("error: " + err);
	  printErrorToRes(err, src, res);
	  return;
      }
      //save it to the peopleSchema
      people.saveData(result, function(err, data){
	  console.log("success: " + data);
	  printSuccToRes(data, src, res);
      });
    });
  });
});

//sync class scheds


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
//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
/*server.get('/*', function(req, res){
    throw new NotFound;
});*/

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

/*everyauth.helpExpress(server);*/
console.log('Listening on http://0.0.0.0:' + port );
