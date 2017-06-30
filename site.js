
module.exports.site_db = {
	tableName : "site_data",
	index : 'id',
	cols : [
		{
			varName: 'id',
			colName: 'id'
		},{
			varName: 'generalWebhook',
			colName: 'gen_web_hook'
		},{
			varName: 'clientId',
			colName: 'client_id'
		},{
			varName: 'clientSecret',
			colName: 'client_secret'
		},{
			varName: 'verifyToken',
			colName: 'verify_token'
		},{
			varName: 'appAuthToken',
			colName: 'app_auth_token'
		},{
			varName: 'tokenHost',
			colName: 'token_host'
		},{
			varName: 'url',
			colName: 'site_url'
		}
	]
};


var siteData = {};
module.exports.initSiteData = function (_siteData){
	siteData = _siteData;
}

module.exports.getSiteData = function (){
	return siteData;
}