
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
		authFlow(user, actionData);
	}
}

// do an action that requires valid auth token, when auth token is populated
function doAuthAction(authAction, user, authToken, actionData){
	// callback on failure of "token invalid" should start the auth flow
}

const slackAuthRedirect 	= "https://slack.com/oauth/authorize";
const slackTokenExchange 	= "https://slack.com/api/oauth.access";
const siteAuthLanding 		= "/oauthProvLanding";
// begin request of an auth token
function authFlow(user, actionData){
	// send redirect user to slack oauth url
	// user provides permsions
	// slack redirects user to our provided redirect url
	// we use provided code to exchange for auth token
	var ourRedirect = site.url + siteAuthLanding + "?" + querystring.stringify(actionData);
	
	/* {
		token: 		token,
		ts: 		timestamp,
		channel:	message.channel,
		text:		message.text,
		attachments:message.attachments,
		as_user:	'false'
    }); */
}

app.get('/oauthProvLanding/', function(req, res) {
	// user redirected here by slack
	// request should have code and verified by prev 'state'
});
