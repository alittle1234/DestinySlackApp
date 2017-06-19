const express = require('express');
const app = express();

const request = require('request');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const querystring = require('querystring');


const users 	= require('./user');
const site 		= require('./site');
const bungie 	= require('./bungie');
const db 		= require('./db');

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
* 	return all users json
*/
function printUsers(userData, req, res){
	console.log('printUsers...');
	console.log(JSON.stringify(userData, null, 2));
	res.send(JSON.stringify(userData, null, 2));
}

/* 
* 	handle get: return user json
*/
app.get('/users/', function(req, res) {
	console.log('Asking for users...');
	users.getUsers(function(userData){
		console.log('Performing Callback...');
		printUsers(userData, req, res);
	});
	console.log('Done Asking for users...');
});


/* 
* 	handle get: get the site data
*/
app.get('/site/', function(req, res) {
	console.log('Getting Site data...');
	
	db.getData( site.site_db, function(objectMap){
		console.log('Performing Site Data Callback...');
		console.log(JSON.stringify(objectMap, null, 2));
		res.status(200).end();
	});
	
	console.log('Done Getting Site data....');
});





const simple_oauth = require('simple-oauth2');
var oauth;
function initOauth2(){
	// Set the configuration settings
	credentials = {
		client: {
			id: siteData.clientId,
			secret: siteData.clientSecret
		},
		auth: {
			tokenHost: siteData.tokenHost
		}
	}
	oauth = simple_oauth.create(credentials);
}

var siteData;
function initSiteData(objectMap){
	siteData = objectMap[1];
}

// initialize site data on startup
db.getData( site.site_db, function(objectMap){
	console.log('Performing Site Data Callback...');
	initSiteData(objectMap);
});


// Initialize the OAuth2 Library
function initOauth(done){
	if(siteData){
		// set variable data w sitedata
		initOauth2();
		done();
	}else{
		console.log('Getting Site Data...');
		db.getData( site.site_db, function(objectMap){
			console.log('Performing Site Data Callback...');
			initSiteData(objectMap);
			// set variable data w sitedata
			initOauth2();
			done();
		});
	}
}

app.get('/oauthAsk/', function(req, res) {
	console.log('oauthAsk...');
	
	console.log('oauthAsk req...');
	console.log(req.originalUrl);
	var qs = req.originalUrl.substring("/oauthAsk/".length);
	
	// user has oauth token?
		// yes... do oauth required task
		// no... request auth from user via redirect
			// get auth permision from user
				// get auth permision from server
					//....
						// do oauth required task
	var params = querystring.parse(qs);
	
	var userId = parseInt(params.userId);
	var authAction = params.action; // needs more context for action...
	var actionData = params; // the rest of the params?
	
	users.getUser(userId, null, function(user){
		var authToken = user.authToken;
	
		if(oauth){
			authActionStart(authAction, user, authToken, actionData);
		}else{
			initOauth(function(){
				authActionStart(authAction, userId, authToken, actionData);
			});
		}
	} );
	
	console.log('oauthAsk Done...');
});

function authActionStart(authAction, user, authToken, actionData){
	if(authToken){
		// do action
		doAuthAction(authAction, user, authToken);
	}else{
		// do auth flow
		authFlow(user, function(authAction, user, authToken){
			console.log('auth flow final callback...');
			doAuthAction(authAction, user, authToken);
		});
	}
}

// do an action that requires valid auth token, when auth token is populated
function doAuthAction(authAction, user, authToken, actionData){
	
}

// begin request an auth token
function authFlow(user, callback){
	// send redirect?  need req/res object?
}


/* 
* 	handle bungie id from url
*/
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

/* 
* 	perform a get request. send data collected to callback
*/
function doGetData(url, callback){
	console.log('doGet...');
	dataStr = '';
	request
		.get(url)
		.on('response', function(response) {
			console.log(response.statusCode);
			console.log(response.headers['content-type']);
			//console.log("response: " + JSON.stringify(response, null, 2));
		})
		.on("data", function(chunk) {
			//console.log("BODY: " + chunk);
			dataStr += chunk;
		})
		.on("end", function() {
			callback(dataStr);
		})
	 
}


/* 
* 	handle post: end point for /d command
*/
app.post('/d', urlencodedParser, function(req, res) {
    if (!req.body) {
		console.error('no req body' + req);
		return res.sendStatus(400);
	}
		
	handleDestinyReq(req, res);
});


/* 
* 	handle post:  endpoint for button actions
*/
app.post('/d/actions', urlencodedParser, function(req, res) {
    if (!req.body) {
		console.error('no req body' + req);
		return res.sendStatus(400);
	}
	
	handleDestinyReq(req, res);
});

var icon_url = ""; //"http://tiles.xbox.com/tiles/VV/QY/0Wdsb2JhbC9ECgQJGgYfVilbL2ljb24vMC84MDAwAAAAAAAAAP43VEo=.jpg"; 
var app_name = "Destiny App";

var menu_color 		= "#3AA3E3";
var invite_color 	= "#31110A";
var join_ask 		= "Join them?";

var join_attach_id = "join_actions";
var join_poll_attach_id = "join_poll";
var imon_cache = [];


/* 
* 	menu actions
*		actions to perform in web app based on the id of action
*/
var action = {
	imon : 				"imon",
	join : 				"join",
	
	gettingon : 		"getingonat",
	gettingon_menu : 	"onatmenu",
	gettingon_start : 	"onat_start",
	gettingon_hour : 	"onat_hour",
	gettingon_amp : 	"onat_ampm",
	gettingon_day : 	"onat_day",
	
	askgeton : 			"askgeton",
	
	setname : 			"name",
	setimage : 			"image",
	
	refreshDestiny :    "bid",
};


/* 
* 	destiny activity types
*/
var activity = {
	raid : 		"Raid",
	trials : 	"Trials",
	pvp : 		"PvP",
	strike : 	"Strike",
}


/* 
* 	handle all the destiny app requests
*/
function handleDestinyReq(req, res){
	res.status(200).end(); // prevents weird time-out response
	
	var concat = '';
	try{
		if(req.body){
			var reqBody = req.body;
					
			// TODO add bot, text scaning
			// TODO complete anyone getting on?
			// TODO move methods to classes?
			// TODO add ACTIVITY types (raid, pvp, pve, trials)
			
			
			if(reqBody.payload){ // an action button was clicked
				var payload = JSON.parse(reqBody.payload); // turn payload into json obj
				
				console.log('payload: ' + JSON.stringify(payload, null, 2) );
				
				var actionName = payload.actions[0].name;
				
				// SEND MESSAGE -- IM ON
				if(action.imon == actionName){
					sendImOn(payload, payload.user);
				}
				
				
				// MENU -- ON AT...
				else if(action.gettingon_menu == actionName){
					sendImOnAt_Menu(payload.response_url, payload);
				}
				
				// MENU
				else if(action.gettingon_start == actionName){
					sendImOnAt_Start(payload.response_url, payload);
				}
				// MENU
				else if(action.gettingon_hour == actionName){
					sendImOnAt_AmPm(payload.response_url, payload);
				}
				// MENU
				else if(action.gettingon_amp == actionName){
					sendImOnAt_Day(payload.response_url, payload);
				}
				// SEND MESSAGE -- ON AT...
				else if(action.gettingon_day == actionName){
					sendGettingOn(payload, payload.user);
				}
				
				// SEND MESSAGE -- ON AT...
				else if(action.askgeton == actionName){
					sendGettingOn(payload, payload.user);
				}
				
				
				// TODO not fully implemented
				/* else if(action.askgeton == actionName){
					sendAskGetOn(payload, payload.user);
				} */
				
				
				// JOIN ACTION
				else if(action.join == actionName){
					handleJoin(payload);
				}
				
				else{
					var message = {
						"text": payload.user.name+" clicked: "+payload.actions[0].name +"\n"
						 + JSON.stringify(payload, null, 2),
						"replace_original": false
					}
					sendMessageToSlackResponseURL(payload.response_url, message);
				}
			}else{
				// SLASH COMMANDS
				console.log('ReqBody: ' + JSON.stringify(reqBody, null, 2) );
				
				if(!reqBody.text || reqBody.text.trim() == ""){
					// show basic menu
					sendBasicMenu(reqBody.response_url);
				}else{
					// parse into command and parameters
					var params = reqBody.text.split(' ');
					
					// set user name
					if(action.setname == params[0]){
						users.setUserName(reqBody.user_id, params[1])
					
					// set user image
					} else if(action.setimage == params[0]){
						users.setUserImage(reqBody.user_id, params[1])
					
					// refresh destiny data
					} else if(action.refreshDestiny == params[0]){
						// get id, validate long
						var bid = params[1];
						if(bid && parseInt(bid)){
							// function (bungieId, callback)
							refreshDestinyData(parseInt(bid), function(data){
								console.log('refreshDestinyData callback...');
								console.log(JSON.stringify(data, null, 2));
								
								console.log(data.bid);
								console.log(data.img);
								console.log(data.name);
								
								//setAndStoreUser = function (userId, name, image, bungieId){
								users.setAndStoreUser(reqBody.user_id, data.name, data.img, data.bid);
								// TODO respond with current user data
							});
						}else{
							// TODO respond with current user data
						}
					}
					
					// IM ON
					else if(action.imon == params[0]){
						// send "I'm On" message
						users.getUser(reqBody.user_id, null, function(user){
							sendImOn(null, user);
						} );
					}
				}
			}
		}else{
			concat += ' NO BODY ';
		}
	}catch(e){
		console.error(e.message);
	}
}

/*
*	return the slack format name reference with player name
*
*/
function getNameRef(user){
	// <@U024BE7LH|bob>
	return users.getPlayerName(user);
}

/* sends a "Player is on!" message
*
*	PetterNincompoop is on Destiny!
*	Join them? [yes] [maybe] [no]
*
*/
function sendImOn(payload, user){
	console.log('SendImOn: \n' + "payload:" + JSON.stringify(payload, null, 2)
	+ "\n user:" + JSON.stringify(user, null, 2));
	
	
	// clear private message
	if(payload) clearPrivate(payload.response_url);
	
	var username = getNameRef(user);
	var title = "_*" + username + "*" + " is on Destiny!_";
	
	var message = {
		"text": title,
		"username": app_name,
		"icon_url": icon_url,
		"replace_original": true,
		"attachments": [
			getJoinAttachment(username, true, user)
		]
	}
	sendMessageToSlackResponseURL(siteData.generalWebhook, message);
}

/* send a "getting on at..." message
* 	can be result of specific time buttons or
* 	result of cache menu responses
*/
function sendGettingOn(payload, user){
	// clear private message
	clearPrivate(payload.response_url);
	
	var time_day = "Sometime Today";
	
	if(imon_cache[payload.user.id] && payload.actions[0].selected_options){
		time_day = imon_cache[payload.user.id] + " " + payload.actions[0].selected_options[0].value;
	}else{
		time_day = payload.actions[0].value;
	}
	
	imon_cache[payload.user.id] = null;
	
	var username = getNameRef(user);
	var title = "_*" + username + "*" + " is getting on Destiny at:_\n";
	title += "*"+time_day+"*";
	
	var message = {
		"text": title,
		"username": app_name,
		"icon_url": icon_url,
		"replace_original": true,
		"attachments": [
			getJoinAttachment(username, true, user)
		]
	};
	
			
			
	sendMessageToSlackResponseURL(siteData.generalWebhook, message);
}

/* send a "anyone getting on?" message
* 	TODO not fully implemented
*/
function sendAskGetOn(payload, user){
	// clear private message
	clearPrivate(payload.response_url);
	
	var time = "Today"; // Tonight | Tommorow | this Weekend
	
	var username = getNameRef(user);
	var title = "*" + username + ":* " +"_Is anyone getting on Destiny " + time + "?_";
	
	var message = {
		"text": title,
		"username": app_name,
		"icon_url": icon_url,
		"replace_original": true,
		"attachments": [
			getJoinAttachment(username, false, user)
		]
	}
	sendMessageToSlackResponseURL(siteData.generalWebhook, message);
}

/* 	the join question attachment for orginal message posts
* 	buttons triger the 'join' action whcih updates the poll results
*/
function getJoinAttachment(username, ask=true, user){
	return {
				"text": ask ? join_ask : "",
				"fallback": "Join " + username + " on Destiny?",
				"callback_id": join_attach_id,
				"color": invite_color,
				"attachment_type": "default", // TODO what is this?
				"thumb_url": users.getThumbUrl(user),

				"actions": [
					{
						"name": action.join,
						"value": "yes",
						"text": "Yes",
						"type": "button"
					},
					{
						"name": action.join,
						"value": "maybe",
						"text": "Maybe",
						"type": "button"
					},
					{
						"name": action.join,
						"value": "no",
						"text": "No",
						"type": "button"
					}
				]
			}
}

/* 
*	the "poll results" attachment with fields
*/
function getPollAttachment(fieldArray){
	return {
				"callback_id": join_poll_attach_id,
				"fallback": "Join Poll",
				"color": invite_color,
				"fields": fieldArray
			}
}

/* 	
*	handles join action for all join attachments
* 	join poll becomes second attachment to all messages
*	contains the names of users who clicked yes, no, maybe 
*/
function handleJoin(payload){
	var fieldValSplit = ", ";
	//console.log('payload: \n' + JSON.stringify(payload, null, 2));
	// get message as original message
	var message = payload.original_message;
	
	var username = getNameRef(payload.user);
	var choice = payload.actions[0].value;
	// "fields":
	var fieldsArray =  [
                {
                    "title": "Yes",
                    "value": "",
                    "short": false
                },
				{
                    "title": "Maybe",
                    "value": "",
                    "short": false
                },
				{
                    "title": "No",
                    "value": "",
                    "short": false
                }
            ];
			
	// find attachement with poll data
	var pollIndex = 1;
	if(message.attachments){
		for(var i = 1; i < message.attachments.length; i++){
			if(message.attachments[i].callback_id == join_poll_attach_id){
				pollIndex = i;
				break;
			}
		}
	}
	
	var hasValues = [];
	// remove user from field if exist
	if(message.attachments[pollIndex] && message.attachments[pollIndex].fields){
		fieldsArray = message.attachments[pollIndex].fields;
		for (var i = 0; i < fieldsArray.length; i++) {
			hasValues[i] = false;
			if(fieldsArray[i].value){
				var vals = fieldsArray[i].value.split(fieldValSplit);
				// reset field value property
				fieldsArray[i].value = "";
				for (var k = 0; k < vals.length; k++) {
					var v = vals[k];
					if(v){
						v = v.replace(fieldValSplit, "").trim();
						// add values back that are not current user
						if(v && v.length > 0 && v != username){
							fieldsArray[i].value += (k > 0 ? fieldValSplit : "") + v ;
							hasValues[i] = true;
						}
					}
					
				}
			}
		}
	}
	
	// add user to chosen field
	var fieldNum = 0;
	if(choice == "maybe"){
		fieldNum = 1;
	}else if(choice == "no"){
		fieldNum = 2;
	}
	fieldsArray[fieldNum].value += (hasValues[fieldNum] ? fieldValSplit : "") + username;
	
	// set second attachment as fields
	message.attachments[pollIndex] = getPollAttachment(fieldsArray);
	// replace original
	message.replace_original = true;
	
	// send message to response
	// sendMessageToSlackResponseURL(payload.response_url, message);
	
	console.log("Payload...");
	// console.log(JSON.stringify(payload, null, 2));
	console.log("Message...");
	// console.log(JSON.stringify(message, null, 2));
	
	if(siteData){
		// try updating message with api
		updateMessage(message.ts, message, siteData.appAuthToken);
	
	}else{
		console.log('Getting Site Data...');
		db.getData( site.site_db, function(objectMap){
			console.log('Performing Site Data Callback...');
			initSiteData(objectMap);
			
			// try updating message with api
			updateMessage(message.ts, message, siteData.appAuthToken);
		});
	}
}


// get the 'command' sent... should be if /d is used in conj w another
// slack bot can scan user input and auto-send slash command to activate app
function parseText(textString){
	// text contains "command" plus parameters
	// i dont know how these are deliminated yet
	// could be json?
	return "";
}

// string version of json req body
function getRequestBodyText(req){
	return ' Request: ' + JSON.stringify(req.body);
}

/* 
*	sent the menu for the "im on at..."
* 	has static button options and 'custom' drop-down menu options
*/
function sendImOnAt_Menu(responseURL, payload){
	imon_cache[payload.user.id] = null;
	var message = {
		"replace_original": true,
		"attachments": [
			{
				"text": "I'm On At:",
				"fallback": "Im On At menu",
				"callback_id": "destiny_imonat_menu",
				"color": menu_color,
				"attachment_type": "default",
				"actions": [
				// 1200 500 8-900
					{
						"name": action.gettingon,
						"value": "12:00 PM Today",
						"text": "12:00 PM",
						"type": "button"
					},
					{
						"name": action.gettingon,
						"value": "5:00 PM Today",
						"text": "5:00 PM",
						"type": "button"
					},
					{
						"name": action.gettingon,
						"value": "8-9:00 PM Today",
						"text": "8-9:00 PM",
						"type": "button"
					},
				// start custom time sequence
					{
						"name": action.gettingon_start,
						"value": "submit custon",
						"text": "Custom Time",
						"type": "button"
					}
				]
			}
		]
	}
	sendMessageToSlackResponseURL(responseURL, message)
}

function sendImOnAt_Start(responseURL, payload){
	imon_cache[payload.user.id] = "";
	var message = {
		"replace_original": true,
		"attachments": [
			{
				"text": "I'm On At:",
				"fallback": "Im On At menu",
				"callback_id": "destiny_imonat_menu",
				"color": menu_color,
				"attachment_type": "default",
				"actions": [
				// 1-12
					{
				    "name": action.gettingon_hour,
                    "text": "Hour...",
                    "type": "select",
                    "options": [
                        {
                            "text": "1:00",
                            "value": "1:00"
                        },
						{
                            "text": "2:00",
                            "value": "2:00"
                        },
						{
                            "text": "3:00",
                            "value": "3:00"
                        },
						{
                            "text": "4:00",
                            "value": "4:00"
                        },
						{
                            "text": "5:00",
                            "value": "5:00"
                        },
						{
                            "text": "6:00",
                            "value": "6:00"
                        },
						{
                            "text": "7:00",
                            "value": "7:00"
                        },
						{
                            "text": "8:00",
                            "value": "8:00"
                        },
						{
                            "text": "9:00",
                            "value": "9:00"
                        },
						{
                            "text": "10:00",
                            "value": "10:00"
                        },
						{
                            "text": "11:00",
                            "value": "1:00"
                        },
						{
                            "text": "12:00",
                            "value": "12:00"
                        }
					]
					}
				]
			}
		]
	}
	sendMessageToSlackResponseURL(responseURL, message)
}

function sendImOnAt_AmPm(responseURL, payload){
	imon_cache[payload.user.id] = payload.actions[0].selected_options[0].value;
	var message = {
		"replace_original": true,
		"attachments": [
			{
				"text": "I'm On At:" + "\n" + imon_cache[payload.user.id],
				"fallback": "Im On At menu",
				"callback_id": "destiny_imonat_menu",
				"color": menu_color,
				"attachment_type": "default",
				"actions": [
				// am | pm
					{
				    "name": action.gettingon_amp,
                    "text": "AM/PM...",
                    "type": "select",
                    "options": [
                        {
                            "text": "AM",
                            "value": "AM"
                        },
						{
                            "text": "PM",
                            "value": "PM"
                        }
					]
					},
				// re-starts custom time sequence
					{
						"name": action.gettingon_start,
						"value": "submit custon",
						"text": "Re-select",
						"type": "button"
					}
				]
			}
		]
	}
	sendMessageToSlackResponseURL(responseURL, message)
}

function sendImOnAt_Day(responseURL, payload){
	imon_cache[payload.user.id] += " " + payload.actions[0].selected_options[0].value;
	var message = {
		"replace_original": true,
		"attachments": [
			{
				"text": "I'm On At:" + "\n" + imon_cache[payload.user.id],
				"fallback": "Im On At menu",
				"callback_id": "destiny_imonat_menu",
				"color": menu_color,
				"attachment_type": "default",
				"actions": [
				// Today | Tommorow | Tuesday | Friday | Saturday | Sunday
					{
				    "name": action.gettingon_day,
                    "text": "Day...",
                    "type": "select",
                    "options": [
                        {
                            "text": "Today",
                            "value": "Today"
                        },
						{
                            "text": "Tomorrow",
                            "value": "Tomorrow"
                        },
						{
                            "text": "Tuesday",
                            "value": "Tuesday"
                        },
						{
                            "text": "Friday",
                            "value": "Friday"
                        },
						{
                            "text": "Saturday",
                            "value": "Saturday"
                        },
						{
                            "text": "Sunday",
                            "value": "Sunday"
                        }
					]
					},
				// re-starts custom time sequence
					{
						"name": action.gettingon_start,
						"value": "submit custon",
						"text": "Re-select",
						"type": "button"
					}
				]
			}
		]
	}
	sendMessageToSlackResponseURL(responseURL, message)
}

/* 
*	replaces the original private app message with "message posted"
* 	so that the buttons cannot be pressed again and takes up less space
*/
function clearPrivate(responseURL){
	var message = {
		"replace_original": true,
		"text": "_Message posted._"
	}
	sendMessageToSlackResponseURL(responseURL, message);
}


/* 
*	the basic menu
*/
function sendBasicMenu(responseURL){
	var message = {
		"attachments": [
			{
				"text": "Choose an action:",
				"fallback": "Basic Destiny App Menu",
				"callback_id": "destiny_basic",
				"color": menu_color,
				"attachment_type": "default",
				"actions": [
					{
						"name": action.imon,
						"value": action.imon,
						"text": "I'm On!",
						"type": "button"
					},
					{
						"name": action.gettingon_menu,
						"value": action.gettingon_menu,
						"text": "I'm On At:",
						"type": "button"
					},
					/* {
						"name": action.askgeton,
						"value": action.askgeton,
						"text": "Getting On?",
						"type": "button"
					} */
					// TODO menu type, "others"
					// a menu drop-down of stats, status, etc
				]
			}
		]
	}
	sendMessageToSlackResponseURL(responseURL, message);
}

// temp send message
function sendMessage(responseURL){
	var message = {
		"text": "This is your first interactive message",
		"attachments": [
			{
				"text": "Building buttons is easy right?",
				"fallback": "Shame... buttons aren't supported in this land",
				"callback_id": "button_tutorial",
				"color": "#3AA3E3",
				"attachment_type": "default",
				"actions": [
					{
						"name": "yes",
						"text": "yes",
						"type": "button",
						"value": "yes"
					},
					{
						"name": "no",
						"text": "no",
						"type": "button",
						"value": "no"
					},
					{
						"name": "maybe",
						"text": "maybe",
						"type": "button",
						"value": "maybe",
						"style": "danger"
					}
				]
			}
		]
	}
	sendMessageToSlackResponseURL(responseURL, message)
}


/* 
*	send the JSONmessage as POST to the responseURL
*/
function sendMessageToSlackResponseURL(responseURL, JSONmessage){
    var postOptions = {
        uri: responseURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        json: JSONmessage
    }
    request(postOptions, (error, response, body) => {
        if (error){
            console.error(error);
        }
		console.log("Response...");
		//console.log(response);
    })
}


/* 
*	send a slack api update message request
*/
function updateMessage(timestamp, message, token){
	// message.channel
	// message.text
	// message.attachments = [{"normalAttr":"somethingElse"}]
	// message.as_user = false?
	
	var data = querystring.stringify({
		token: 		token,
		ts: 		timestamp,
		channel:	message.channel.id,
		text:		message.text,
		attachments:message.attachments,
		as_user:	'false'
    });
	
	sendDataToSlackApi('chat.update', data);
}


// TODO probalby needs error and response functions as params?
function sendDataToSlackApi(methodApi, data){
	var options = {
		uri: 'https://slack.com/api/' + methodApi,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': data.length
		},
		body: data
		
	};
    
    request(options, (error, response, body) => {
        if (error){
            console.error(error);
        }
		console.log("sendDataToSlackApi Response...");
		//console.log(response);
		console.log(response.body);

		
		response.on('data', function (chunk) {
			console.log("body: " + chunk);
		});
    })
}


