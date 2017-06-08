
var db = require('./db');


var def_thum_url = "https://www.bungie.net/common/destiny_content/icons/971ab9229b8164aff89c7801f332b54c.jpg";
//"https://www.bungie.net/common/destiny_content/icons/61110a769953428def89124e0fad7508.jpg";

var users_cache = null;
db.getUsers(users_cache, null);

/* 
* 	get a user obj
*/
module.exports.getUserCache = function (){
	return users_cache;
}

/* 
* 	get a user obj
*/
module.exports.getUser = function (userId, userName, callback){
	console.log('user.getUser(userId)...');
	// check cache not null
		// get lates users --> async
	if(!users_cache || users_cache == null){
		db.getUsers(users_cache, function(userArray){
			users_cache = userArray;
			localGetUser(userId, userName, callback);
		}  );
		return;
	}
		
	localGetUser(userId, userName, callback);
}

function localGetUser(userId, userName, callback){
	console.log('user.localGetUser(userId)...');
	// if user null
		// store new user w/ id --> async
	if(!users_cache[userId]){
		setAndStoreUser(userId, userName);
	}
		
	// else return user
	callback( users_cache[userId] );
}


function newUser(userId, userName, imgUrl, bungieId){
	return {
			"id" :				userId,
			"name" :			userName,
			"img_url" :			imgUrl,
			"destiny_name" :	name,
			"bungie_id" :		bungieId
	};
}


/* 
* 	get latest users
*/
module.exports.getUsers = function (callback){
	console.log('user.getUsers(db)...');
	db.getUsers(users_cache, callback);
}


/* 
* 	lookup thumbnail for most recent player background
*/
module.exports.getThumbUrl = function (user){
	if(users_cache && users_cache[user.id]
		&& users_cache[user.id].img_url){
		console.log('getThumbUrl...' + users_cache[user.id].img_url  );
		return users_cache[user.id].img_url;
	}
	return def_thum_url;
}


/* 
* 	get associated destiny name
*/
module.exports.getPlayerName = function (user){
	if(users_cache && users_cache[user.id]
		&& users_cache[user.id].destiny_name){
		return users_cache[user.id].destiny_name;
	}
	return user.name;
}

/* 
* 	set the name or image url of a user and store in the database
*/
module.exports.setAndStoreUser = function (userId, name, image, bungieId){
	console.log('setAndStoreUser...' + userId + ' ' + name + ' ' + image  );
	
	if(!users_cache[userId]){
		console.log('new user...');
		users_cache[userId] = newUser(userId, null, name, image, bungieId);
	}else{
		
		users_cache[userId].id = userId; // TODO im not sure what the point of this is
		if(name){
			users_cache[userId].destiny_name = name;
		}
		if(image){
			users_cache[userId].img_url = image;
		}
	}
	
	
	console.log('Users Pre-Store...');
	console.log(JSON.stringify(users_cache, null, 2));
	
	storeUsers();
}


/* 
* 	store the users in db
*/
function storeUsers(){
	console.log('storeUsers...');
	db.storeUsers(users_cache);
}


/* 
* 	set the user destiny name
*/
module.exports.setUserName = function (userId, name){
	console.log('setUserName...');
	if(!users_cache || !users_cache[userId]){
		// get latest users than add new data to db
		getUsers(setAndStoreUser.bind(this, userId, name, null));
	}else{
		setAndStoreUser(userId, name, null);
	}
}

/* 
* 	set the user image url
*/
module.exports.setUserImage = function (userId, image){
	console.log('setUserImage...');
	if(!users_cache || !users_cache[userId]){
		// get latest users than add new data to db
		getUsers(setAndStoreUser.bind(this, userId, null, image));
	}else{
		setAndStoreUser(userId, null, image);
	}
}