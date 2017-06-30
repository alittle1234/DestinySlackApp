const users 		= require.main.require('./user');
const bungie 		= require.main.require('./bungie');
const slack 		= require.main.require('./slack/request');
const logger 		= require.main.require('./logger');
const site  		= require.main.require('./site');

const Message 		= require.main.require('./message').Message;
const MessageData	= require.main.require('./message').MessageData;

 
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


const joinButtons = {
	yes : {
		"name": action.join,
		"value": "yes",
		"text": "Yes",
		"type": "button"
	},
	no : {
		"name": action.join,
		"value": "no",
		"text": "No",
		"type": "button"
	}
	maybe : {
		"name": action.join,
		"value": "maybe",
		"text": "Maybe",
		"type": "button"
	}
	standby : {
		"name": action.join,
		"value": "standby",
		"text": "Standby",
		"type": "button"
	}
	imon : {
		"name": action.join,
		"value": "imon",
		"text": "I'm On",
		"type": "button"
	}
	illgeton : {
		"name": action.join,
		"value": "illgeton",
		"text": "I'll Get On",
		"type": "button"
	}
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

	/* get action channel from payload */
	function getChannelId(payload){
		// update channel id for message api
		if(payload.channel_id){
			message.channel = payload.channel_id;
		}		
		else{
			message.channel = payload.channel.id;
		}
	}
	
	/* returns a new basic slack message with attachments */
	function slackMessage(title, channel, attachments){
		var message = {
			"text": title,
			"username": staticProps.appName,
			"icon_url": staticProps.iconUrl,
			"replace_original": true,
			"attachments": attachments,
			channel = channel
		}
		
		// stringify attachments array
		message.attachString = JSON.stringify(message.attachments);
		return message;
	}

	function addMessage(messageId, message, payload, user, buttonKeys){
		// MessageData(join, activity, time, timeZone)
		var join = {
			hasJoin: true,
			buttons: {}
		};
		
		if(buttonKeys){
			for(var i = 0; i < buttonKeys.length; i++){
				var key = buttonKeys[i];
				join.buttons[key] = {
					uids: [],
					limit: 0
				}
			}
		}
		
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
		
		/*  Join
				Add | Remove
				Add-Yes | Rm-Yes
				Add-No | Rm-No
				Add-Maybe | Rm-Maybe
				Add-Standby | Rm-Standby
				? | Yes Limit
					0, 3, 4, 6
			Activity
				Clear(?)
				Add-Trials | Rm-Trials(?)
				Add-Raid | Rm-Raid(?)
				...
			Date
				Now , Today , Tommorow , F , Sat , Sun , Other
						Month -> (This) + 1
						Day -> (This) -> + EoM | 1-31
					Hour -> 1-12
					AmPm -> AM, PM
					
			Start Over
				avl everywher, resets to top
		*/
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
	
	/* sends a new templated slack message w title and attachments to channel used in action */
	function sendNewBasicSlack(payload, user, title, attachments, joinButtons, title, time){
		var fullTitle = title.replace(TITLE_UID, getNameRef(user));
		if(time.general){
			fullTitle = fullTitle.replace(TITLE_TIME, time.general);
		} else if (time.specific){
			getTimeFromObj(time);
			var msFormat = "<!date^"+time.specific.ms+"^{date_short_pretty} at {time}|"+time.specific.fallback+">";
			fullTitle = fullTitle.replace(TITLE_TIME, msFormat);
		}
		
		var message = slackMessage(
			fullTitle, 
			getChannelId(payload), 
			attachments);
			
		if(!joinButtons){
			joinButtons = [joinButtons.yes.value, joinButtons.no.value];
		}
		
		slack.postMessage(message, siteData.appAuthToken, function(messageId){
			debug('in post callback. messageId:' + messageId);
			
			// store message
			addMessage(messageId, message, payload, user, joinButtons, title, time);
			
			// send update message
			sendMessageUpdateMenu(payload.response_url, messageId);
		});
	}
	
	/* sends a "Player is on!" message
	*
	*	PetterNincompoop is on Destiny!
	*	Join them? [yes] [maybe] [no]
	*
	*/
	function sendImOn(payload, user){
		sendNewBasicSlack(payload, user, 
			"_*" + TITLE_UID + "*" + " is on Destiny!_", 
			getJoinAttachment(getNameRef(user), true, user),
			[joinButtons.yes, joinButtons.no],
			{now: true});
	}
	
	/* send a "getting on at..." message
	* 	can be result of specific time buttons or
	* 	result of cache menu responses
	*/
	function sendGettingOn(payload, user){
		var time_day = "Sometime In the Future";
		if(imon_cache[payload.user.id] && payload.actions[0].selected_options){
			time_day = imon_cache[payload.user.id] + " " + payload.actions[0].selected_options[0].value;
		}else{
			time_day = payload.actions[0].value;
		}
		imon_cache[payload.user.id] = null;
		
		sendNewBasicSlack(payload, user, 
			"_*" + TITLE_UID + "*" + " is getting on Destiny *" + TITLE_TIME + "*_", 
			getJoinAttachment(getNameRef(user), true, user),
			[joinButtons.yes, joinButtons.no],
			{specific: {
				hour: 1,
				min: 2,
				
				day: 12,
				month: 11,
				
				tz: "Eastern"
				}
			}
		);
	}

	/* send a "anyone getting on?" message
	*/
	function sendAskGetOn(payload, user){
		sendNewBasicSlack(payload, user, 
			"*" + TITLE_UID + ":* " +"_Is anyone getting on Destiny *" + TITLE_TIME + "*?_", 
			getJoinAttachment(getNameRef(user), false, user, null, [joinButtons.imon, joinButtons.illgeton]),
			[joinButtons.imon, joinButtons.illgeton],
			{general: timeGenVals.today});
		
	}
	
	const TITLE_UID = "#UID";
	const TITLE_TIME = "#TIME";
	
	const timeGenVals = {
		today: 			"Today",
		tonight: 		"Tonight",
		tommorow: 		"Tommorow",
		thisWeekend: 	"This Weekend",
	}
	
	var time = {
		now: true,
		
		general: timeGenVals.today, 
		
		specific: {
			hour: 1,
			min: 2,
			
			day: 12,
			month: 11,
			year: 2017,
			
			tz: "Eastern",
			mil: 12345,
			fallback: "Feb 18, 2014 at 6:39 AM PST"
		}
	}
	
	/* set the mil and fallback values in time.specific */
	function getTimeFromObj(time){
		if(!time.specific.mil){
			var utcOffSet = utcOffsets[tzKeyValues[isDst()][time.tz.toLowerCase()]];
			var dt = new Date(time.specific.day+"/"+time.specific.month+"/"+time.specific.year+
							" "+time.specific.hour+":"+time.specific.min+" "+utcOffset);
			time.specific.mil = dt.getTime();
			time.specific.fallback = dt.toString();
		}
	}
	
	const tzKeyValues = {
		eastern: "Eastern",
		east: "Eastern",
		est: "Eastern",
		edt: "Eastern",
		
		central: "Central",
		cent: "Central",
		cst: "Central",
		cdt: "Central",
		
		mountain: "Mountain",
		mount: "Mountain",
		mst: "Mountain",
		mdt: "Mountain",
		
		pacific: "Pacific",
		pac: "Pacific",
		pst: "Pacific",
		pdt: "Pacific",
	}
	
	const utcOffsets = {
		"true" : {
			Eastern:  "UTC-04:00",
			Central:  "UTC-05:00",
			Mountain: "UTC-06:00",
			Pacific:  "UTC-07:00",
		}, 
		"false" : {
			Eastern:  "UTC-05:00",
			Central:  "UTC-06:00",
			Mountain: "UTC-07:00",
			Pacific:  "UTC-08:00",
		}
	}
	
	/* is the current server time in daylight savings time */
	function isDst(){
		var today = new Date();
		var jan = new Date(today.getFullYear(), 0, 1);
		var jul = new Date(today.getFullYear(), 6, 1);
		var stdTimezoneOffset =  Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

		return today.getTimezoneOffset() < stdTimezoneOffset;
	}
	
	/* 	the join question attachment for orginal message posts
	* 	buttons triger the 'join' action whcih updates the poll results
	*/
	function getJoinAttachment(username, ask=true, user, message, joinButtonArray){
		var attach = {
			"text": ask ? staticProps.message.joinAsk : "",
			"fallback": "Join " + username + " on Destiny?",
			"callback_id": callbackIds.joinAsk,
			"color": staticProps.message.publicColor,
			"attachment_type": "default",
			"thumb_url": users.getThumbUrl(user),

			actions: []
		}
		
		if(joinButtonArray){
			for(var i = 0; i < joinButtonArray.length; i++){
				attach.actions.push(joinButtonArray[i]);
			}
		}else if(message){
			var buttonKeys = Object.keys(joinButtons);
			for(var i = 0; i < buttonKeys.length; i++){
				var key = buttonKeys[i];
				if(message.data.join.buttons[key]){
					attach.actions.push(joinButtons[key]);
				}
			}
		} else {
			attach.actions.push(joinButtons.yes);
			attach.actions.push(joinButtons.no);
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

	/* 
	*	the join poll result field array
	*/
	function getJoinResultFields(message){
		var fieldsArray = [];
		
		// get all the button types' keys
		var buttonKeys = Object.keys(joinButtons);
		for(var i = 0; i < buttonKeys.length; i++){
			var key = buttonKeys[i];
			// add new field if message has this button
			if(message.data.join.buttons[key]){
				fieldsArray.push({
					title: joinButtons[key].text,
					value: "",
					"short": false
				});
				populateFieldValue(message, key, fieldsArray[fieldsArray.length-1]);
			}
		}
		
		debug("FieldsArray:");
		debug(fieldsArray);
		return fieldsArray;
	}
	
	const fieldValSplit = ", ";
	function populateFieldValue(message, buttonKey, field){
		if(message.data.join.buttons[buttonKey] && message.data.join.buttons[buttonKey].uids){
			var uids = message.data.join.buttons[buttonKey].uids;
			for(var i = 0; i < uids.length; i++){
				users.getUser(uids[i], null, function(user){
					field.value += (i > 0 ? fieldValSplit : "") + getNameRef(user);
				} );
			}
		}
	}
	
	// remove user from field
	function addAndRemove(user, message, joinArea){
		var uids = message.data.join.buttons[joinArea].uids;
		if(!uids){
			uids = [];
			message.data.join.buttons[joinArea].uids = uids;
		}
	
		// remove user from all arrays
		var buttonKeys = Object.keys(joinButtons);
		for(var i = 0; i < buttonKeys.length; i++){
			// remove from area array
			var button = message.data.join.buttons[buttonKeys[i]];
			if(button && button.uids){
				var index = button.uids.indexOf(user.id);
				if(index > -1){
					button.uids.splice(index, 1);
				}
			}
		}
			
		// add user, check limit
		var limit = message.data.join.buttons[joinArea].limit;
		if(limit && limit > 0){
			if(uids.length < limit){
				uids.push(user.id);
			}
		}else{
			uids.push(user.id);
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
		addAndRemove(payload.user, messageClass, payload.actions[0].value);
		
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



