const express 		= require('express');
const app 			= express();

const request 		= require('request');
const bodyParser 	= require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const querystring 	= require('querystring');


const users 		= require('./user');
const site 			= require('./site');
const db 			= require('./db');
const logger 		= require('./logger');


app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


/* 
* 	return the index page
*/
app.get('/', function(req, res) {
	res.render('pages/index2');
});


/* 
* 
*/
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});



/* 
	// #########
	// TODO
	// protect or remove
	// 
* 	handle get: return user json
*/
app.get('/users/', function(req, res) {
	logger.debug('Asking for users...');
	users.getUsers(function(userData){
		logger.debug('printUsers...');
		logger.debug(JSON.stringify(userData, null, 2));
		res.send(JSON.stringify(userData, null, 2));
	});
	logger.debug('Done Asking for users...');
});


/* 
* 	handle get: get the site data
app.get('/site/', function(req, res) {
	console.log('Getting Site data...');
	
	db.getData( site.site_db, function(objectMap){
		console.log('Performing Site Data Callback...');
		console.log(JSON.stringify(objectMap, null, 2));
		res.status(200).end();
	});
	
	console.log('Done Getting Site data....');
});

*/





// *** initialize site data on startup
db.getData( site.site_db, function(objectMap){
	logger.debug('Performing Site Data Callback...');
	site.initSiteData(objectMap[1]);
});

const main 		= require('./slack/main');


/* 
* 	handle post: end point for /d command
*/
app.post('/d', urlencodedParser, function(req, res) {
    if (!req.body) {
		logger.error('no req body' + req);
		return res.sendStatus(400);
	}
		
	main.handleDestinyReq(req, res);
});


/* 
* 	handle post:  endpoint for button actions
*/
app.post('/d/actions', urlencodedParser, function(req, res) {
    if (!req.body) {
		logger.error('no req body' + req);
		return res.sendStatus(400);
	}
	
	main.handleDestinyReq(req, res);
});

