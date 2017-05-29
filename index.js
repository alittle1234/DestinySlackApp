var express = require('express');
var request = require('request')
var bodyParser = require('body-parser')
var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('pages/index2');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


// https://polar-island-85982.herokuapp.com/


// should the response inlcude the request
var log = true;

// end point for /d command
app.post('/d', urlencodedParser, function(req, res) {
	//+ req.params.join(",")
	
    if (!req.body) {
		return res.sendStatus(400);
	}
		
	handleDestinyReq(req, res);
});

// endpoint for button actions
app.post('/d/actions', urlencodedParser, function(req, res) {
	//+ req.params.join(",")
	
    if (!req.body) {
		return res.sendStatus(400);
	}
	
	handleDestinyReq(req, res);
});

var action_imon = "imon";
var action_getingon = "getgonat";
var action_askgeton = "askgeton";

// handle all the destiny app requests
function handleDestinyReq(req, res){
	res.status(200).end(); // prevents weird time-out response
	
	var concat = '';
	try{
		if(req.body){
			var reqBody = req.body;
			
			var log = getRequestBodyText(req); // TODO append log to all responses when log is true
			
			var textData = parseText(req.body.text);
			
			var payload;
			if(req.body.payload){ // an action button was clicked
				payload = JSON.parse(req.body.payload); // turn payload into json obj
				
				if(action_imon == payload.actions[0].name){
					sendImOn(payload, payload.user);
				}
				
				else if(action_getingon == payload.actions[0].name){
					sendGettingOn(payload, payload.user);
				}
				
				else if(action_askgeton == payload.actions[0].name){
					sendAskGetOn(payload, payload.user);
				}
				
				else{
					var message = {
						"text": payload.user.name+" clicked: "+payload.actions[0].name,
						"replace_original": false
					}
					sendMessageToSlackResponseURL(payload.response_url, message);
				}
			}else{
				// test send interactive message
				//sendMessage(reqBody.response_url);
				
				// TODO check action... was basic menu?
				getBasicMenu(reqBody.response_url);
				
				// parse text
				// perform action
				// add "log"
			}
		}else{
			concat += ' NO BODY ';
		}
	}catch(e){ // why doesnt this work?
		concat = e.message;
	}
}

var icon_url = "http://tiles.xbox.com/tiles/VV/QY/0Wdsb2JhbC9ECgQJGgYfVilbL2ljb24vMC84MDAwAAAAAAAAAP43VEo=.jpg"; 
var app_name = "Destiny App";
var general_webhook = "https://hooks.slack.com/services/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";

var menu_color = "#3AA3E3";
var invite_color = "#31110A";
var join_ask = "Join them?";

var join_im_on_callback = "join_im_on";
var def_thum_url = "https://www.bungie.net/common/destiny_content/icons/61110a769953428def89124e0fad7508.jpg";

// lookup thumbnail for most recent player background
function getThumbUrl(username){
	return def_thum_url;
}

// get associated destiny name
function getPlayerName(user){
	return user.name;
}

// i'm on
// PetterNincompoop is on Destiny!
// [image] [timestamp?] [activity?]
// Join them? [yes] [maybe] [no]
function sendImOn(payload, user){
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

function sendGettingOn(payload, user){
	var time = "12:00 PM";
	var day = "Today";
	
	var username = getPlayerName(user);
	var title = "_*" + username + "*" + " is getting on Destiny at:_\n";
	title += "*"+time + " " + day+"*";
	
	var message = {
		"text": title,
		"username": app_name,
		"icon_url": icon_url,
		"replace_original": true,
		"attachments": [
			{"text": "req payload: \n" + JSON.stringify(payload)},
			getJoinAttachment(username)
		]
	}
	sendMessageToSlackResponseURL(general_webhook, message);
}

// this one is kind of pointless?
function sendAskGetOn(payload, user){
	var time = "Today"; // Tonight | Tommorow | this Weekend
	
	var username = getPlayerName(user);
	var title = "_*" + username + ":*" +"Is anyone getting on Destiny *" + time + "*?_";
	
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
						"name": "yes",
						"value": "yes",
						"text": "Yes",
						"type": "button"
					},
					{
						"name": "maybe",
						"value": "maybe",
						"text": "Maybe",
						"type": "button"
					},
					{
						"name": "no",
						"value": "no",
						"text": "No",
						"type": "button"
					}
					// TODO need to handle "poll" actions
				]
			}
}
// anyone getting on
// Join them? [yes] [maybe] [no]

// raid tonight|tommorow ?
// Join them? [yes] [maybe] [no]


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
function sendImOnAtMenu(responseURL){
	var message = {
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
						"name": action_imon,
						"value": "a12",
						"text": "12:00 PM",
						"type": "button"
					},
					{
						"name": action_imon,
						"value": "a05",
						"text": "5:00 PM",
						"type": "button"
					},
					{
						"name": action_imon,
						"value": "a89",
						"text": "8-9:00 PM",
						"type": "button"
					}
				]
			},
			getTimeMenuAttachment()
		]
	}
	sendMessageToSlackResponseURL(responseURL, message)
}

function getTimeMenuAttachment(){
	return {
				//"text": "Time Menu",
				"fallback": "Time Menu",
				"callback_id": "destiny_imonat_time_menu",
				"color": menu_color,
				"attachment_type": "default",
				"actions": [
				// 1-12
					{
				    "name": "time_list",
                    "text": "Hour...",
                    "type": "select",
                    "options": [
                        {
                            "text": "1:00",
                            "value": "01"
                        },
						{
                            "text": "2:00",
                            "value": "02"
                        },
						{
                            "text": "3:00",
                            "value": "03"
                        },
						{
                            "text": "4:00",
                            "value": "04"
                        },
						{
                            "text": "5:00",
                            "value": "05"
                        },
						{
                            "text": "6:00",
                            "value": "06"
                        },
						{
                            "text": "7:00",
                            "value": "07"
                        },
						{
                            "text": "8:00",
                            "value": "08"
                        },
						{
                            "text": "9:00",
                            "value": "09"
                        },
						{
                            "text": "10:00",
                            "value": "10"
                        },
						{
                            "text": "11:00",
                            "value": "11"
                        },
						{
                            "text": "12:00",
                            "value": "12"
                        }
					]
					},
				// am | pm
					{
				    "name": "ampm_list",
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
					
				// Today | Tommorow | Tuesday | Friday | Saturday | Sunday
					{
				    "name": "day_list",
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
				// SUBMIT
					{
						"name": action_imon,
						"value": "submit custon",
						"text": "Submit Custom",
						"type": "button"
					}
				],
			}
}

// return the basic menu as response
function getBasicMenu(responseURL){
	var message = {
		//"text": "This is your first interactive message",
		"attachments": [
			{
				"text": "Destiny Action:",
				"fallback": "Interactive buttons need to be enabled.",
				"callback_id": "destiny_basic",
				"color": menu_color,
				"attachment_type": "default", // TODO what is this?
				"actions": [
					{
						"name": action_imon,
						"value": action_imon,
						"text": "I'm On!",
						"type": "button"
					},
					{
						"name": action_getingon,
						"value": action_getingon,
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
	sendMessageToSlackResponseURL(responseURL, message)
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


// send a message to slack url
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
            // handle errors as you see fit
        }
    })
}


