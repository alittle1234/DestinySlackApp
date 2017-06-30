const _debug = process.env.IS_DEBUG == 'true';

module.exports.debug = function (message){
	if(_debug){
		console.log(message);
	}
}

module.exports.error = function (message){
	console.error(message);
}