var cheerio = require('cheerio');


var base_url = "https://www.bungie.net";
module.exports.processDestinyPage = function (bungieId, htmlBody, callback){
	var data = {
		"bid" : bungieId,
		"img": "url",
		"name" : "myName"
	}
	if(htmlBody){
		document = cheerio.load(htmlBody);
		
		// do dom for img
		console.log("Try Image...");
		
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
			console.log(str);
			data.img = base_url + str;
		}
		
		
		// do dom for name
		console.log("Try Name...");
		
		// document.getElementsByClassName(
		//	"destiny-account current")[0]
		//	.getElementsByClassName("standardTitle display-name")[0]
		//	.textContent
		
		var name = document('.destiny-account').filter('.current')
				.children('.standardTitle').filter('.display-name')
				.text();
		console.log(name);
		data.name = name;
		
		
		callback(data);
	}else{
		
		console.log("HTML was null");
	}
}


/* 
* 	handle bungie id from url
app.get('/bid/', function(req, res) {
	console.log('bid...');
	
	console.log('bid req...');
	console.log(req.originalUrl);
	var q = req.originalUrl.substring(5);
	
	refreshDestinyData(parseInt(querystring.parse(q).bid), function(data){
		console.log('bid callback...');
		console.log(JSON.stringify(data, null, 2));
		
		console.log(data.bid);
		console.log(data.img);
		console.log(data.name);
		
		res.status(200).end();
	});
	console.log('bid Done...');
});

*/



/* 
* 	refresh bungie id data( name, image ) by sending get request and 
*	 parsing response
*/
function refreshDestinyData (bungieId, callback){
	console.log('refreshDestinyData(bungieId)...');
	
	var url = "https://www.bungie.net/en/Profile/254/" + bungieId;
	
	// do get on bungie profile page
	doGetData(url,
		function(response){
			bungie.processDestinyPage(bungieId, response, callback);
		});
}