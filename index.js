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
					doImOn(payload, payload.user);
				}else{
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
function doImOn(payload, user){
	var username = getPlayerName(user);
	var title = "*" + username + "*" + " is on Destiny!";
	
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

function getJoinAttachment(username){
	return {
				"text": join_ask,
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

// return the basic menu as response
function getBasicMenu(responseURL){
	var message = {
		//"text": "This is your first interactive message",
		"attachments": [
			{
				"text": "Destiny Action:",
				"fallback": "Interactive buttons need to be enabled.",
				"callback_id": "destiny_basic",
				"color": "#3AA3E3",// TODO destiny basic color
				"attachment_type": "default", // TODO what is this?
				"actions": [
					{
						"name": action_imon,
						"value": action_imon,
						"text": "I'm On!",
						"type": "button"
					},
					{
						"name": "askgeton",
						"value": "askgeton",
						"text": "Is Anyone Getting On?",
						"type": "button"
					},
					{
						"name": "getgonat",
						"value": "getgonat",
						"text": "Getting On At:",
						"type": "button" // should be menu or return menu types?
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


