var express = require('express');
var request = require('request')
var bodyParser = require('body-parser')
var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// var bodyParser = require('body-parser')
// app.use(bodyParser.json());       // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  // extended: true
// })); 
// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('pages/index2');
});

app.get('/c', function(req, res) {
  res.send('pages/index2');
});

app.post('/dead', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  res.send('welcome, ' + req.body.command)
})

var log = true;
app.post('/d', urlencodedParser, function(req, res) {
	//+ req.params.join(",")
	
    if (!req.body) {
		return res.sendStatus(400);
	}
		
	  
	var concat = '';
	try{
		if(req.body){
			var reqBody = req.body;
			
			var log = getRequestBodyText(req); // TODO append log to all responses when log is true
			
			var textData = parseText(req.body.text);
			
			var payload;
			if(req.body.payload){ // an action button was clicked
				payload = JSON.parse(req.body.payload); // turn payload into json obj
				var message = {
					"text": payload.user.name+" clicked: "+payload.actions[0].name,
					"replace_original": false
				}
				sendMessageToSlackResponseURL(payload.response_url, message);
			}
			
			// test send interactive message
			//sendMessage(reqBody.response_url);
			
			// TODO check action... was basic menu?
			getBasicMenu(reqBody.response_url);
			
			// parse text
			// perform action
			// add "log"
		}else{
			concat += ' NO BODY ';
		}
	}catch(e){ // why doesnt this work?
		concat = e.message;
	}
	
    res.send('data c: ' + concat  );
});

function parseText(textString){
	// text contains "command" plus parameters
	// i dont know how these are deliminated yet
	// could be json?
}

function getRequestBodyText(req){
	return ' Request: ' + JSON.stringify(req.body);
}

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
						"name": "imon",
						"value": "imon",
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
// https://polar-island-85982.herokuapp.com/button-endpoint

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


