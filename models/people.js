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
  , cf = require('./campus');


/**
  * Campus Fellowship People- calling it peopleSchema
  */
var peopleSchema = new Schema({
    name: String,
    campusFellowship: String
});


/*model the current theWine schema as theWine document*/
var People = mongoose.model('People', peopleSchema);
exports.people = People;

/*this saves data */
//statics?
exports.saveData = function(data, cb) {
  console.log("printing data: " + data);
  cb(null, "great");
}

