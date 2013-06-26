/*
 module imports:
	mongoose- object modeling for mongodb
	schema- the schema for each model
	safe_date- a way to date safely
	Objectid- the objectid used to denote objects
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , People = require('./people').schema;


/**
  * Campus Fellowship 
  */
var cfSchema = new Schema({
    name: String,
    church: String,
    people: [String] //matches valid people
});


var campus = mongoose.model('cf', cfSchema);
exports.cf = campus;
exports.schema = cfSchema;

/*this saves data */
exports.saveData = function(data, cb) {

}

//the person should be a valid people schema
exports.addUserToCF = function(person, cb) {
  
}
