const querystring 	= require('querystring');
const request 		= require('request');

const logger 		= require.main.require('./logger');

const slack = {
	method : {
		uri: 'https://slack.com/api/',
		chat : {
			update: 'chat.update',
			post: 'chat.postMessage',
		}
	}
}

const reqType = {
	post: 'POST',
	get: 'GET',
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
	postMessageToSlackResponseURL(responseURL, message)
}


/* 
*	send the JSONmessage as POST to the responseURL
*/
module.exports.postMessageToSlackResponseURL = function (responseURL, JSONmessage){
    var postOptions = {
        uri: responseURL,
        method: reqType.post,
        headers: {
            'Content-type': 'application/json'
        },
        json: JSONmessage
    }
    request(postOptions, (error, response, body) => {
        if (error){
            logger.error(error);
        }
		logger.debug("Response...");
		//logger.debug(response);
    })
}


/* 
*	send a slack api update message request
*/
module.exports.postUpdateMessage = function (timestamp, message, token){
	var data = querystring.stringify({
		token: 		token,
		ts: 		timestamp,
		channel:	message.channel,
		text:		message.text,
		attachments:message.attachString,
		as_user:	'false'
    });
	
	postDataToSlackApi(slack.method.chat.update, data);
}

/* 
*	send a slack api a post message request
*/
module.exports.postMessage = function ( message, token, postResponse){
	var data = querystring.stringify({
		token: 		token,
		channel:	message.channel,
		text:		message.text,
		icon_url:	message.icon_url,
		attachments:message.attachString,
		as_user:	'false'
    });
	
	postDataToSlackApi(slack.method.chat.post, data, function(body){
		if(postResponse){
			// json
			var j = JSON.parse(body);
			// get ts
			postResponse(j.ts);
		}
	});
}


// TODO probalby needs error and response functions as params?
function postDataToSlackApi(methodApi, data, responseCallback){
	var options = {
		uri: 		slack.method.uri + methodApi,
		method: 	reqType.post,
		headers: 	{
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': data.length
					},
		body:		 data
	};
	
	logger.debug("sending data...");
	logger.debug(data);
    
    request(options, (error, response, body) => {
        if (error){
            logger.error(error);
        }
		logger.debug("postDataToSlackApi Response...");
		//logger.debug(response);
		logger.debug(response.body);

		if(responseCallback) 
			responseCallback(response.body);
		
		response.on('data', function (chunk) {
			logger.debug("body: " + chunk);
			
		});
    })
}


/* 
* 	perform a get request. send data collected to callback
*/
module.exports.doGetData = function (url, callback){
	logger.debug('doGet...');
	dataStr = '';
	request
		.get(url)
		.on('response', function(response) {
			logger.debug(response.statusCode);
			logger.debug(response.headers['content-type']);
			//logger.debug("response: " + JSON.stringify(response, null, 2));
		})
		.on("data", function(chunk) {
			//logger.debug("BODY: " + chunk);
			dataStr += chunk;
		})
		.on("end", function() {
			callback(dataStr);
		})
	 
}

