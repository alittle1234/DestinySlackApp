
const Message 		= require.main.require('./message').Message;
const MessageData	= require.main.require('./message').MessageData;

const users 		= require.main.require('./user');
const bungie 		= require.main.require('./bungie');
const slack 		= require.main.require('./slack/request');
const logger 		= require.main.require('./logger');
const site  		= require.main.require('./site');

/* 
const tempMs = new Message("1234", "", Date.now(), Date.now(), "uid1234", new MessageData({hasJoin:true}, null, Date.now(), "Eastern"), null);
messageCache[tempMs.timestamp] = tempMs;
debug(messageCache[tempMs.timestamp].messageData.join);
 */
 
//var icon_url 		= ""; //"http://tiles.xbox.com/tiles/VV/QY/0Wdsb2JhbC9ECgQJGgYfVilbL2ljb24vMC84MDAwAAAAAAAAAP43VEo=.jpg"; 

const staticProps = {
	appName : "Destiny App",
	iconUrl : "",
	// TODO icon url needs public host? make one on web server?
	
	message : {
		privateColor : 	"#3AA3E3",
		publicColor : 	"#31110A",
		joinAsk : 		"Join them?"
	}
}

const callbackIds = {
	joinAsk :		"joinAsk",
	joinPoll :		"joinPoll",
	basicMenu :		"basicMenu",
	onAtScheduler :	"imOnAtMenu",
	updateMesgMenu :"updateMessage-",
}

/*  cache for building im on scheduler message over repeated requests */
var imon_cache = [];
/*  cache for messages sent to slack */
var messageCache = {};

/* 
* 	menu actions
*		actions to perform in web app based on the id of action
*/
const action = {
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
	
	addJoin: 			"addJoin",
	removeJoin: 		"removeJoin",
};


/* 
* 	destiny activity types
*/
const activity = {
	raid : 		"Raid",
	trials : 	"Trials",
	pvp : 		"PvP",
	strike : 	"Strike",
}


var siteData = site.getSiteData();
/* 
* 	handle all the destiny app requests
*/
module.exports.handleDestinyReq = function (req, res){
	res.status(200).end(); // prevents weird time-out response
	siteData = site.getSiteData();
	
	var concat = '';
	try{
		if(req.body){
			var reqBody = req.body;
			
			if(reqBody.payload){ // an action button was clicked
				var payload = JSON.parse(reqBody.payload); // turn payload into json obj
				
				debug('payload: ' + JSON.stringify(payload, null, 2) );
				
				// get user
				users.getUser(payload.user.id, null, function(user){
					payload.user = user;
					// perform action
					handleDestinyButtonAction(payload);
				} );
			}else{
				// SLASH COMMANDS
				debug('ReqBody: ' + JSON.stringify(reqBody, null, 2) );
				
				// get user
				users.getUser(reqBody.user_id, null, function(user){
					reqBody.user = user;
					// perform action
					handleSlashCommand(reqBody);
				} );
			}
		}else{
			concat += ' NO BODY ';
		}
	}catch(e){
		logger.error(e.message);
	}
}
	

		
	/*
	*	handle button actions
	*
	*/
	function handleDestinyButtonAction(payload){
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
		else if(action.addJoin == actionName){
			handleAddJoin(payload);
		}
		else if(action.removeJoin == actionName){
			handleRemoveJoin(payload);
		}
		
		else{
			var message = {
				"text": payload.user.name+" clicked: "+payload.actions[0].name +"\n"
				 + JSON.stringify(payload, null, 2),
				"replace_original": false
			}
			slack.postMessageToSlackResponseURL(payload.response_url, message);
		}
	}

	/*
	*	handle slash commands
	*
	*/
	function handleSlashCommand(reqBody){
		var userId = reqBody.user_id;
		if(!reqBody.text || reqBody.text.trim() == ""){
			// show basic menu
			sendBasicMenu(reqBody.response_url);
		}else{
			// parse into command and parameters
			var params = reqBody.text.split(' ');
			
			// set user name
			if(action.setname == params[0]){
				users.setUserName(userId, params[1])
			
			// set user image
			} else if(action.setimage == params[0]){
				users.setUserImage(userId, params[1])
			
			// refresh destiny data
			} else if(action.refreshDestiny == params[0]){
				// get id, validate long
				var bid = params[1];
				if(bid && parseInt(bid)){
					// function (bungieId, callback)
					bungie.refreshDestinyData(parseInt(bid), function(data){
						debug('refreshDestinyData callback...');
						debug(JSON.stringify(data, null, 2));
						
						debug(data.bid);
						debug(data.img);
						debug(data.name);
						
						//setAndStoreUser = function (userId, name, image, bungieId){
						users.setAndStoreUser(userId, data.name, data.img, data.bid);
						// TODO respond with current user data
					});
				}else{
					// TODO respond with current user data
				}
			}
			
			// IM ON
			else if(action.imon == params[0]){
				// send "I'm On" message
				users.getUser(userId, null, function(user){
					sendImOn(reqBody, user);
				} );
			}
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
		debug('SendImOn: \n' + "payload:" + JSON.stringify(payload, null, 2)
		+ "\n user:" + JSON.stringify(user, null, 2));
		
		var username = getNameRef(user);
		var title = "_*" + username + "*" + " is on Destiny!_";
		// TODO getMessageTitle(message, user); // get title based on message type and other properties
		var message = {
			"text": title,
			"username": staticProps.appName,
			"icon_url": staticProps.iconUrl,
			"replace_original": true,
			"attachments": [
				getJoinAttachment(username, true, user)
			]
		}
		
		// update channel id for message api
		if(payload.channel_id){
			message.channel = payload.channel_id;
		}		
		else{
			message.channel = payload.channel.id;
		}
		
		// stringify attachments array
		message.attachString = JSON.stringify(message.attachments);
		slack.postMessage(message, siteData.appAuthToken, function(messageId){
			debug('in post callback. messageId:' + messageId);
			
			// store message
			addMessage(messageId, message, payload, user);
			
			// send update message
			sendMessageUpdateMenu(payload.response_url, messageId);
		});
	}

	function addMessage(messageId, message, payload, user){
		// MessageData(join, activity, time, timeZone)
		var join = {
			hasJoin: true,
			
			hasYes: true,
			hasNo: true, 
		};
		var xtraData = new MessageData(join, [], Date.now(), "Eastern");
		// new Message(timestamp, responseUrl, dateAdded, dateModified, userId, extraData, orginalMessage)
		messageCache[messageId] = new Message(messageId, "", Date.now(), Date.now(), user.userId, xtraData, message);
		
		debug(messageCache[messageId]);
	}

	function sendMessageUpdateMenu(responseURL, messageId){
		var messageClass = messageCache[messageId];
		var actions = [];
		if(messageClass.messageData.join.hasJoin){
			actions.push({
				"name": action.removeJoin,
				"value": messageId,
				"text": "Remove Join",
				"type": "button"
			});
		}else{
			actions.push({
				"name": action.addJoin,
				"value": messageId,
				"text": "Add Join",
				"type": "button"
			});
		}
		var message = {
			"attachments": [
				{
					"text": "Update Message:",
					"fallback": "Update Message Menu",
					"callback_id": callbackIds.updateMesgMenu + messageId,
					"color": staticProps.message.privateColor,
					"attachment_type": "default",
					"replace_original": true,
					"actions": actions
				}
			]
		}
		slack.postMessageToSlackResponseURL(responseURL, message);
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
			"username": staticProps.appName,
			"icon_url": staticProps.iconUrl,
			"replace_original": true,
			"attachments": [
				getJoinAttachment(username, true, user)
			]
		};
		
				
				
		slack.postMessageToSlackResponseURL(siteData.generalWebhook, message);
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
			"username": staticProps.appName,
			"icon_url": staticProps.iconUrl,
			"replace_original": true,
			"attachments": [
				getJoinAttachment(username, false, user)
			]
		}
		slack.postMessageToSlackResponseURL(siteData.generalWebhook, message);
	}

	/* 	the join question attachment for orginal message posts
	* 	buttons triger the 'join' action whcih updates the poll results
	*/
	function getJoinAttachment(username, ask=true, user, message){
		var attach = {
			"text": ask ? staticProps.message.joinAsk : "",
			"fallback": "Join " + username + " on Destiny?",
			"callback_id": callbackIds.joinAsk,
			"color": staticProps.message.publicColor,
			"attachment_type": "default",
			"thumb_url": users.getThumbUrl(user),

			"actions": [{
				"name": action.join,
				"value": "yes",
				"text": "Yes",
				"type": "button"
			},{
				"name": action.join,
				"value": "no",
				"text": "No",
				"type": "button"
			}]
		}
		
		if(message){
			attach.actions = [];
			if(message.messageData.join.hasYes){
				attach.actions.push({
					"name": action.join,
					"value": "yes",
					"text": "Yes",
					"type": "button"
				});
			}
			if(message.messageData.join.hasMaybe){
				attach.actions.push({
					"name": action.join,
					"value": "maybe",
					"text": "Maybe",
					"type": "button"
				});
			}
			if(message.messageData.join.hasNo){
				attach.actions.push({
					"name": action.join,
					"value": "no",
					"text": "No",
					"type": "button"
				});
			}
			if(message.messageData.join.hasStandby){
				attach.actions.push({
					"name": action.join,
					"value": "standby",
					"text": "Standby",
					"type": "button"
				});
			}
		}
		
		return attach;
	}

	/* 
	*	the "poll results" attachment with fields
	*/
	function getJoinPollAttachment(fieldArray){
		return {
			"callback_id": callbackIds.joinPoll,
			"fallback": "Join Poll",
			"color": staticProps.message.publicColor,
			"fields": fieldArray
		};
	}

	/* 
	*	handle add join poll action
	*/
	function handleAddJoin(payload){
		debug("handleAddJoin...");
		
		var ts = payload.actions[0].value;
		debug(messageCache[ts]);
		
		var messageClass = messageCache[ts];
		var message = messageClass.orginalMessage;

		messageClass.messageData.join.hasJoin = true;
		messageClass.dateModified = Date.now();
				
		// set second attachment as fields
		message.attachments[0] = getJoinAttachment(getNameRef(payload.user), true, payload.user, messageClass);
		message.attachments[1] = getJoinPollAttachment(getJoinResultFields(messageClass));
		// replace original
		message.replace_original = true;
		
		// try updating message with api
		message.channel = payload.channel.id;
		// stringify message attachments
		message.attachString = JSON.stringify(message.attachments);
		slack.postUpdateMessage(ts, message, siteData.appAuthToken);

		// update the "update menu"
		sendMessageUpdateMenu(payload.response_url, ts);
	}

	/* 
	*	handle remove join poll action
	*/
	function handleRemoveJoin(payload){
		debug("handleRemoveJoin...");
		
		var ts = payload.actions[0].value;
		debug(messageCache[ts]);
		
		var messageClass = messageCache[ts];
		var message = messageClass.orginalMessage;

		messageClass.messageData.join.hasJoin = false;
		messageClass.dateModified = Date.now();
				
		// remove join ask and poll results attachments
		if(message.attachments && message.attachments[0].callback_id == callbackIds.joinAsk){
			message.attachments.splice(0, 1);
		}
		if(message.attachments && message.attachments[0].callback_id == callbackIds.joinPoll){
			message.attachments.splice(0, 1);
		}
		
		// replace original
		message.replace_original = true;
		
		// try updating message with api
		message.channel = payload.channel.id;
		// stringify message attachments
		message.attachString = JSON.stringify(message.attachments);
		slack.postUpdateMessage(ts, message, siteData.appAuthToken);

		// update the "update menu"
		sendMessageUpdateMenu(payload.response_url, ts);
	}

	const fieldValSplit = ", ";
	/* 
	*	the join poll result field array
	*/
	function getJoinResultFields(message){
		var fieldsArray = [];
		if(message.messageData.join.hasYes){
			fieldsArray.push({
				title: "Yes",
				value: "",
				"short": false
			});
			populateField(message, "yess", fieldsArray[fieldsArray.length-1]);
		}
		
		if(message.messageData.join.hasStandby){
			fieldsArray.push({
				title: "Standby",
				value: "",
				"short": false
			});
			populateField(message, "standbys", fieldsArray[fieldsArray.length-1]);
		}
		
		if(message.messageData.join.hasMaybe){
			fieldsArray.push({
				title: "Maybe",
				value: "",
				"short": false
			});
			populateField(message, "maybes", fieldsArray[fieldsArray.length-1]);
		}
		
		if(message.messageData.join.hasNo){
			fieldsArray.push({
				title: "No",
				value: "",
				"short": false
			});
			populateField(message, "nos", fieldsArray[fieldsArray.length-1]);
		}
		
		return fieldsArray;
	}
	
	function populateField(message, joinField, field){
		if(message.messageData.join[joinField]){
			var joinValues = message.messageData.join[joinField];
			for(var i = 0; i < joinValues.length; i++){
				users.getUser(joinValues[i], null, function(user){
					field.value += (i > 0 ? fieldValSplit : "") + getNameRef(user);
				} );
			}
		}
	}

	// add or remove from message.messageData.join[choice]
	function addUserToJoinArea(user, choice, message){
		if(choice == "yes"){
			addAndRemove(user, message, "yess", ["nos", "maybes", "standbys"], 
				message.messageData.join.hasYesLimit ? message.messageData.join.yesLimit : -1);
			
		} else if(choice == "maybe"){
			addAndRemove(user, message, "maybes", ["nos", "yess", "standbys"]);
			
		} else if(choice == "no"){
			addAndRemove(user, message, "nos", ["yess", "maybes", "standbys"]);
			
		} else if(choice == "standby"){
			addAndRemove(user, message, "standbys", ["nos", "maybes", "yess"]);
			
		}
	}
	
	// remove user from field
	function addAndRemove(user, message, joinArea, removeArray, limit){
		var joinValues = [];
		if(message.messageData.join[joinArea]){
			joinValues = message.messageData.join[joinArea];
		}else{
			message.messageData.join[joinArea] = joinValues;
		}
		
		// remove user from array
		{
			var index = joinValues.indexOf(user.id);
			if(index > -1){
				joinValues.splice(index, 1);
			}else{
				// add user, check limit
				if(limit && limit > 0){
					if(joinValues.length < limit){
						joinValues.push(user.id);
					}
				}else{
					joinValues.push(user.id);
				}
			}
		}
		
		if(removeArray){
			for(var i = 0; i < removeArray.length; i++){
				// remove from area array
				var removeValues = message.messageData.join[removeArray[i]];
				if(removeValues){
					var rIndex = removeValues.indexOf(user.id);
					if(rIndex > -1){
						removeValues.splice(rIndex, 1);
					}
				}
			}
		}
	}

	/* 	
	*	handles join action for all join attachments
	* 	join poll becomes second attachment to all messages
	*	contains the names of users who clicked yes, no, maybe 
	*/
	function handleJoin(payload){
		//debug('payload: \n' + JSON.stringify(payload, null, 2));
		// get message as original message
		var messageClass = messageCache[payload.message_ts];
		
		// add user to choice area, remove from others
		addUserToJoinArea(payload.user, payload.actions[0].value, messageClass);
		
		// build poll result attahcment w field array available in join data
		
		var message = messageClass.orginalMessage;
		// set second attachment with fields
		message.attachments[1] = getJoinPollAttachment(getJoinResultFields(messageClass)); // set at index 1 since join poll should be at 0
		// replace original
		message.replace_original = true;
		// update channel for message api
		message.channel = payload.channel.id;
		// stringify message attachments
		message.attachString = JSON.stringify(message.attachments);
		slack.postUpdateMessage(payload.message_ts, message, siteData.appAuthToken);
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
					"callback_id": callbackIds.onAtScheduler,
					"color": staticProps.message.privateColor,
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
		slack.postMessageToSlackResponseURL(responseURL, message)
	}

	function sendImOnAt_Start(responseURL, payload){
		imon_cache[payload.user.id] = "";
		var message = {
			"replace_original": true,
			"attachments": [
				{
					"text": "I'm On At:",
					"fallback": "Im On At menu",
					"callback_id": callbackIds.onAtScheduler,
					"color": staticProps.message.privateColor,
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
		slack.postMessageToSlackResponseURL(responseURL, message)
	}

	function sendImOnAt_AmPm(responseURL, payload){
		imon_cache[payload.user.id] = payload.actions[0].selected_options[0].value;
		var message = {
			"replace_original": true,
			"attachments": [
				{
					"text": "I'm On At:" + "\n" + imon_cache[payload.user.id],
					"fallback": "Im On At menu",
					"callback_id": callbackIds.onAtScheduler,
					"color": staticProps.message.privateColor,
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
		slack.postMessageToSlackResponseURL(responseURL, message)
	}

	function sendImOnAt_Day(responseURL, payload){
		imon_cache[payload.user.id] += " " + payload.actions[0].selected_options[0].value;
		var message = {
			"replace_original": true,
			"attachments": [
				{
					"text": "I'm On At:" + "\n" + imon_cache[payload.user.id],
					"fallback": "Im On At menu",
					"callback_id": callbackIds.onAtScheduler,
					"color": staticProps.message.privateColor,
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
		slack.postMessageToSlackResponseURL(responseURL, message)
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
		slack.postMessageToSlackResponseURL(responseURL, message);
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
					"callback_id": callbackIds.basicMenu,
					"color": staticProps.message.privateColor,
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
		slack.postMessageToSlackResponseURL(responseURL, message);
	}

	function debug(message){
		logger.debug(message);
	}



