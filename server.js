//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 8081)
    , mongoose = require('mongoose')
    , people = require('./models/people')
    , gcm = require('node-gcm');

//Setup Express
var server = express.createServer();

var uristring = process.env.MONGOHQ_URL ||
                process.env.MONGOLAB_URI ||
                'mongodb://localhost/cfapp';

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
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
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
});
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
//var registrationIds =[];


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('index.jade', {
    locals : { 
              title : 'Your Page Title'
             ,description: 'Your Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
	     ,regid: ''
            }
  });
});
server.get('/ajax/trial', function(req, res) {
  console.log("received: ");
});
server.get('/register/:regid', function(req,res){
  var src = "GET REG ID";
  var registration = req.params.regid;
  console.log("this regid: " + registration);
  res.setHeader('Content-Type', 'application/json');
  tempId = [registration];
  //send the gcm message - params = message-literal, regid array, no. of retries, callback
  sender.sendNoRetry(message, tempId, function (err, result) {
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

server.get('/sendReq/:cf', function(req, res) {
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
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Listening on http://0.0.0.0:' + port );
