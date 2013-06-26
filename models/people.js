/*
 module imports:
	mongoose- object modeling for mongodb
	schema- the schema for each model
	safe_date- a way to date safely
	Objectid- the objectid used to denote objects
	fx - unused only for money, but not needed now
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , mongoTypes = require('mongoose-types')
  , async= require('async')
  , cf = require('./campus').cf;

mongoTypes.loadTypes(mongoose, 'email');


/**
  * Campus Fellowship People- calling it peopleSchema
  */
var peopleSchema = new Schema({
    firstname: String,
    lastname: String,
    regid: String,
    campusFellowship: [cfSchema], //make sure matches to valid cf
    password: String,
    phone: Number, // take out the dashes
    email: String
    
});

/*this saves data */
//statics?

/**
  * Campus Fellowship 
  */
var cfSchema = new Schema({
    name: String,
    church: String,
    people: [peopleSchema] //matches valid people
});



/*this saves data */
exports.saveData = function(data, cb) {
  var user = new People({
    regid: data
  });
  user.save(function(err) {
	if(err) return cb(err);
	else return cb(null, "added the user");
  });
}

//the person should be a valid people schema
exports.addUserToCF = function(person, cb) {
  
}

exports.addCF = function(cf, church, cb) {
  var theCF = new campus ({
     name: cf,
     church: church
  });
  theCF.save(function(err) {
     if(err) return cb(err);
     return cb(null, "added the cf: " + cf + " to church: " + church);
  });
  
}

findCF = function(campusfelly, cb) {
   //chagne this to actually add it
  if(campusfelly === "SCF") return cb(null, "SCF");
  campus.findOne({name: campusfelly}, function(err, data) {
    if(err) return cb(err);
    if(data === null) return cb("No CampusFellowships With This Name Found");
    else return cb(null, data);
  });
}

exports.findACF = function(cf, cb) {
  campus.findOne({name: cf}, function(err, data) {
     console.log(data);
     if(err) return cb(err);
     else return cb(null, data);
  });
}

/**
var peopleSchema = new Schema({
    firstname: String,
    lastname: String,
    regid: String,
    campusFellowship: String, //make sure matches to valid cf
    password: String,
    phone: Number, // take out the dashes
    email: String
    
});
**/
peopleSchema.statics.addUser = function(first, last, pass, cf, phone, email, cb) {
  //check to make sure user with the same first, last name and campus fellowship doesn't exist
  People.find({firstname: first, 
               lastname: last,
               campusFellowship: cf}, 
               function(err,data) {
     if(err) return cb(err);
     if(data.length !== 0) return cb("USER ALREADY EXISTS");
  });
  //then, in addition to adding the user, use async to add the user to the campus fellowship
  campus.findOne({name: cf}, function(err, data) {
    if(err) return cb(err);
    var user = new People({
       firstname: first,
       lastname: last,
       campusFellowship: cf,
       password: pass,
       phone: phone,
       email: email
    }); 
    if(data.people === undefined)
    {
       data.people = [JSON.parse(user)];
    } else
      data.people.push(user);
    data.save();
    user.save(function(err) {
       if(err) cb(err);
       else cb(null, "Added User: " + first + " " + last);
    });
  });
 
}

peopleSchema.statics.findAll = function(cb) {
  People.find({}, function(err, data) { 
     if(err) cb(err);
     else cb(null, data);
  });
}

var People = mongoose.model('People', peopleSchema);
exports.people = People;
exports.schema = peopleSchema;


var campus = mongoose.model('cf', cfSchema);
exports.cf = campus;
exports.schema = cfSchema;
