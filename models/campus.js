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
  , People = require('./people');


/**
  * Campus Fellowship 
  */
var cfSchema = new Schema({
    name: String,
    church: String,
    people: [People]
});


/*model the current theWine schema as theWine document*/
var campus = mongoose.model('cf', cfSchema);
exports.cf = campus;

/*this saves data */
exports.saveData = function(data, cb) {

}

