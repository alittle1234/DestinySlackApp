var express = require('express');
var request = require('request')
var bodyParser = require('body-parser')
var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var db = require('./db');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');



app.get('/', function(req, res) {
  res.render('pages/index2');
});

var users = [];
function printUsers(users, req, res){
	console.log('printUsers...');
	console.log(JSON.stringify(users, null, 2));
	res.send(JSON.stringify(users, null, 2));
}

function getUsers(callback){
	console.log('getUsers...');
	db.getUsers(users, callback);
}

function storeUsers(){
	console.log('storeUsers...');
	db.storeUsers(users);
}

app.get('/users/', function(req, res) {
	console.log('Asking for users...');
	getUsers(printUsers.bind(this, users, req, res));
	console.log('Done fetching users...');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


// end point for /d command
app.post('/d', urlencodedParser, function(req, res) {
    if (!req.body) {
		console.error('no req body' + req);
		return res.sendStatus(400);
	}
		
	handleDestinyReq(req, res);
});

// endpoint for button actions
app.post('/d/actions', urlencodedParser, function(req, res) {
    if (!req.body) {
		console.error('no req body' + req);
		return res.sendStatus(400);
	}
	
	handleDestinyReq(req, res);
});

var action_imon = "imon";
var action_join = "join";

var imon_cache = [];
var action_getingon = "getingonat";

var action_onatmenu = "onatmenu";
var action_getingon_start = "onat_start";
var action_getingon_hour = "onat_hour";
var action_getingon_amp = "onat_ampm";
var action_getingon_day = "onat_day";

var action_askgeton = "askgeton";

var action_setName = "name";
var action_setImage = "image";

// handle all the destiny app requests
function handleDestinyReq(req, res){
	res.status(200).end(); // prevents weird time-out response
	
	var concat = '';
	try{
		if(req.body){
			var reqBody = req.body;
			// var message2 = {
						// "text": " payload: \n"
						 // + JSON.stringify(reqBody, null, 2),
						// "replace_original": false
					// }
					// sendMessageToSlackResponseURL(req.body.response_url, message2);
					
			// TODO add bot, text scaning
			// TODO complete anyone getting on?
			// TODO move methods to classes?
			// TODO add ACTIVITY types (raid, pvp, pve, trials)
			
			var payload;
			if(req.body.payload){ // an action button was clicked
				payload = JSON.parse(req.body.payload); // turn payload into json obj
				var actionName = payload.actions[0].name;
				
				// SEND MESSAGE -- IM ON
				if(action_imon == actionName){
					sendImOn(payload, payload.user);
				}
				
				
				// MENU -- ON AT...
				else if(action_onatmenu == actionName){
					sendImOnAt_Menu(payload.response_url, payload);
				}
				
				// MENU
				else if(action_getingon_start == actionName){
					sendImOnAt_Start(payload.response_url, payload);
				}
				// MENU
				else if(action_getingon_hour == actionName){
					sendImOnAt_AmPm(payload.response_url, payload);
				}
				// MENU
				else if(action_getingon_amp == actionName){
					sendImOnAt_Day(payload.response_url, payload);
				}
				// SEND MESSAGE -- ON AT...
				else if(action_getingon_day == actionName){
					sendGettingOn(payload, payload.user);
				}
				
				// SEND MESSAGE -- ON AT...
				else if(action_getingon == actionName){
					sendGettingOn(payload, payload.user);
				}
				
				
				else if(action_askgeton == actionName){
					sendAskGetOn(payload, payload.user);
				}
				
				// JOIN ACTION
				else if(action_join == actionName){
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
				
				if(!reqBody.text || reqBody.text.trim() == ""){
					// show basic menu
					sendBasicMenu(reqBody.response_url);
				}else{
					// parse into command and parameters
					var params = reqBody.text.split(' ');
					if(action_setName = params[0]){
						// set user name
						setUserName(reqBody.user_id, params[1])
					} else if(action_setImage = params[0]){
						// set user image
						setUserImage(reqBody.user_id, params[1])
					}
				}
			}
		}else{
			concat += ' NO BODY ';
		}
	}catch(e){
		console.error(e.message);
		
		//console.log('payload: \n' + JSON.stringify(req, null, 2));
	}
}

var icon_url = ""; //"http://tiles.xbox.com/tiles/VV/QY/0Wdsb2JhbC9ECgQJGgYfVilbL2ljb24vMC84MDAwAAAAAAAAAP43VEo=.jpg"; 
var app_name = "Destiny App";
var general_webhook = "https://hooks.slack.com/services/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";

var menu_color = "#3AA3E3";
var invite_color = "#31110A";
var join_ask = "Join them?";

var join_im_on_callback = "join_im_on";
var def_thum_url = "https://www.bungie.net/common/destiny_content/icons/971ab9229b8164aff89c7801f332b54c.jpg";
//"https://www.bungie.net/common/destiny_content/icons/61110a769953428def89124e0fad7508.jpg";

// lookup thumbnail for most recent player background
function getThumbUrl(username){
	return def_thum_url;
}

// get associated destiny name
function getPlayerName(user){
	if(users && users[user.id]
		&& users[user.id].destiny_name){
		return users[user.id].destiny_name;
	}
	return user.name;
}

function setAndStoreUser(userId, name, image){
	console.log('setAndStoreUser...');
	users[userId].id = userId;
	if(name){
		users[userId].destiny_name = name;
	}
	if(image){
		users[userId].img_url = image;
	}
	
	storeUsers();
}

function setUserName(userId, name){
	console.log('setUserName...');
	if(!users || !users[userId]){
		getUsers(setAndStoreUser.bind(this, userId, name, null));
	}else{
		setAndStoreUser(userId, name, null);
	}
}

function setUserImage(userId, image){
	console.log('setUserImage...');
	if(!users || !users[userId]){
		getUsers(setAndStoreUser.bind(this, userId, null, image));
	}else{
		setAndStoreUser(userId, null, image);
	}
}

/* sends a "Player is on!" message
*
*	PetterNincompoop is on Destiny!
*	Join them? [yes] [maybe] [no]
*
*/
function sendImOn(payload, user){
	// clear private message
	clearPrivate(payload.response_url);
	
	var username = getPlayerName(user);
	var title = "_*" + username + "*" + " is on Destiny!_";
	
	var message = {
		"text": title,
		"username": app_name,
		"icon_url": icon_url,
		"replace_original": true,
		"attachments": [
			getJoinAttachment(username)
		]
	}
	sendMessageToSlackResponseURL(general_webhook, message);
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
	
	var username = getPlayerName(user);
	var title = "_*" + username + "*" + " is getting on Destiny at:_\n";
	title += "*"+time_day+"*";
	
	var message = {
		"text": title,
		"username": app_name,
		"icon_url": icon_url,
		"replace_original": true,
		"attachments": [
			getJoinAttachment(username)
		]
	};
	
			//{"text": "req payload: \n" + JSON.stringify(payload)},
			
	sendMessageToSlackResponseURL(general_webhook, message);
}

/* send a "anyone getting on?" message
* 	TODO not fully implemented
*/
function sendAskGetOn(payload, user){
	// clear private message
	clearPrivate(payload.response_url);
	
	var time = "Today"; // Tonight | Tommorow | this Weekend
	
	var username = getPlayerName(user);
	var title = "*" + username + ":* " +"_Is anyone getting on Destiny " + time + "?_";
	
	var message = {
		"text": title,
		"username": app_name,
		"icon_url": icon_url,
		"replace_original": true,
		"attachments": [
			getJoinAttachment(username, false)
		]
	}
	sendMessageToSlackResponseURL(general_webhook, message);
}

/* 	the join question attachment for orginal message posts
* 	buttons triger the 'join' action whcih updates the poll results
*/
function getJoinAttachment(username, ask=true){
	return {
				"text": ask ? join_ask : "",
				"fallback": "Join " + username + " on Destiny?",
				"callback_id": join_im_on_callback,
				"color": invite_color,
				"attachment_type": "default", // TODO what is this?
				"thumb_url": getThumbUrl(username),

				"actions": [
					{
						"name": action_join,
						"value": "yes",
						"text": "Yes",
						"type": "button"
					},
					{
						"name": action_join,
						"value": "maybe",
						"text": "Maybe",
						"type": "button"
					},
					{
						"name": action_join,
						"value": "no",
						"text": "No",
						"type": "button"
					}
				]
			}
}

/* the "poll results" attachment with fields
*/
function getPollAttachment(fieldArray){
	return {
				
				"fallback": "Join Poll",
				"color": invite_color,
				"fields": fieldArray
			}
}

/* 	handles join action for all join attachments
* 	join poll becomes second attachment to all messages
*	contains the names of users who clicked yes, no, maybe 
*/
function handleJoin(payload){
	//console.log('payload: \n' + JSON.stringify(payload, null, 2));
	// get message as original message
	var message = payload.original_message;
	
	var username = payload.user.name;
	var choice = payload.actions[0].value;
	// "fields":
	var fieldsArray =  [
                {
                    "title": "Yes",
                    "value": "",
                    "short": true
                },
				{
                    "title": "Maybe",
                    "value": "",
                    "short": true
                },
				{
                    "title": "No",
                    "value": "",
                    "short": true
                }
            ];
			
	// remove user from field if exist
	if(message.attachments[1] && message.attachments[1].fields){
		fieldsArray = message.attachments[1].fields;
		for (var i = 0; i < fieldsArray.length; i++) {
			if(fieldsArray[i].value){
				var vals = fieldsArray[i].value.split("\n");
				// reset field value property
				fieldsArray[i].value = "";
				for (var k = 0; k < vals.length; k++) {
					var v = vals[k];
					if(v){
						v = v.replace("\n", "").trim();
						if(v && v != username && v.length > 0){
							fieldsArray[i].value += v + "\n";
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
	fieldsArray[fieldNum].value += username + "\n";
	
	// set second attachment as fields
	message.attachments[1] = getPollAttachment(fieldsArray);
	// replace original
	message.replace_original = true;
	
	// send message to response
	sendMessageToSlackResponseURL(payload.response_url, message);
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
						"name": action_getingon,
						"value": "12:00 PM Today",
						"text": "12:00 PM",
						"type": "button"
					},
					{
						"name": action_getingon,
						"value": "5:00 PM Today",
						"text": "5:00 PM",
						"type": "button"
					},
					{
						"name": action_getingon,
						"value": "8-9:00 PM Today",
						"text": "8-9:00 PM",
						"type": "button"
					},
				// start custom time sequence
					{
						"name": action_getingon_start,
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
				    "name": action_getingon_hour,
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
				    "name": action_getingon_amp,
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
						"name": action_getingon_start,
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
				    "name": action_getingon_day,
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
						"name": action_getingon_start,
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
						"name": action_imon,
						"value": action_imon,
						"text": "I'm On!",
						"type": "button"
					},
					{
						"name": action_onatmenu,
						"value": action_onatmenu,
						"text": "I'm On At:",
						"type": "button"
					},
					{
						"name": action_askgeton,
						"value": action_askgeton,
						"text": "Getting On?",
						"type": "button"
					}
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
    })
}


