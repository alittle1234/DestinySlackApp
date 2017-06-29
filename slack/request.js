const querystring = require('querystring');
const request = require('request');

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
		channel:	message.channel,
		text:		message.text,
		attachments:message.attachString,
		as_user:	'false'
    });
	
	sendDataToSlackApi('chat.update', data);
}

function postMessage( message, token, postResponse){
	var data = querystring.stringify({
		token: 		token,
		channel:	message.channel,
		text:		message.text,
		icon_url:	message.icon_url,
		attachments:message.attachString
    });
	
	sendDataToSlackApi('chat.postMessage', data, function(body){
		if(postResponse){
			// json
			var j = JSON.parse(body);
			// get ts
			postResponse(j.ts);
		}
	});
}


// TODO probalby needs error and response functions as params?
function sendDataToSlackApi(methodApi, data, responseCallback){
	var options = {
		uri: 'https://slack.com/api/' + methodApi,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': data.length
		},
		body: data
		
	};
	
	console.log("sending data...");
	console.log(data);
    
    request(options, (error, response, body) => {
        if (error){
            console.error(error);
        }
		console.log("sendDataToSlackApi Response...");
		//console.log(response);
		console.log(response.body);

		if(responseCallback) 
			responseCallback(response.body);
		
		response.on('data', function (chunk) {
			console.log("body: " + chunk);
			
		});
    })
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

