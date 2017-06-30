const cheerio = require('cheerio');
const logger = require('./logger');


const base_url 		= "https://www.bungie.net";
const profileUrl 	= "https://www.bungie.net/en/Profile/254/";

module.exports.processDestinyPage = function (bungieId, htmlBody, callback){
	var data = {
		"img": "url",
		"bid" : bungieId,
		"name" : "myName"
	}
	if(htmlBody){
		document = cheerio.load(htmlBody);
		
		// do dom for img
		logger.debug("Try Image...");
		
		// document.defaultView.getComputedStyle(
		//	document.getElementsByClassName("destiny-account current")[0]
		//	.getElementsByClassName("icon")[0], null)
		//	.getPropertyValue("background-image")
		
		var style = document('.destiny-account').filter('.current')
				.children('.icon').attr('style');
				
		// parse for bg: "background-image"
		var i = style.indexOf("background-image: url('");
		var len = "background-image: url('".length;
		var str = "none";
		if(i>-1){
			str = style.substring(i+len, style.length-2)
			logger.debug(str);
			data.img = base_url + str;
		}
		
		
		// do dom for name
		logger.debug("Try Name...");
		
		// document.getElementsByClassName(
		//	"destiny-account current")[0]
		//	.getElementsByClassName("standardTitle display-name")[0]
		//	.textContent
		
		var name = document('.destiny-account').filter('.current')
				.children('.standardTitle').filter('.display-name')
				.text();
		logger.debug(name);
		data.name = name;
		
		
		callback(data);
	}else{
		
		logger.debug("HTML was null");
	}
}


/* 
* 	handle bungie id from url
app.get('/bid/', function(req, res) {
	logger.debug('bid...');
	
	logger.debug('bid req...');
	logger.debug(req.originalUrl);
	var q = req.originalUrl.substring(5);
	
	refreshDestinyData(parseInt(querystring.parse(q).bid), function(data){
		logger.debug('bid callback...');
		logger.debug(JSON.stringify(data, null, 2));
		
		logger.debug(data.bid);
		logger.debug(data.img);
		logger.debug(data.name);
		
		res.status(200).end();
	});
	logger.debug('bid Done...');
});

*/


/* 
* 	refresh bungie id data( name, image ) by sending get request and 
*	 parsing response
*/
module.exports.refreshDestinyData = function (bungieId, callback){
	logger.debug('refreshDestinyData(bungieId)...');
	
	// do get on bungie profile page
	doGetData(profileUrl + bungieId,
		function(response){
			bungie.processDestinyPage(bungieId, response, callback);
		});
}