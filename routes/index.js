
/*
 * module imports for cruvee api, wine model, snooth api, url and parsing.
 * these modules enable extra functions that i need
 */

  var  url = require('url')
     , people = require('../models/people') 
     , campus = require('../models/campus');


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


