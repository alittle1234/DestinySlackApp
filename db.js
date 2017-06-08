var pg = require('pg');
pg.defaults.ssl = true;


module.exports.getUsers = function(unused, setUsers) {
	//var usersa = [];
	console.log('Get Users...');
	
	var users = [];
	const uOut = [];
	
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		console.log('Connecting...');
		const results = []; // why this defined here?
		const uIn = [];
		// Handle connection errors
		if(err) {
			done();
			console.log(err);
			return res.status(500).json({success: false, data: err});
		}
		
		// SQL Query > Select Data
		console.log('Run Query...');
		const query = client
						.query('SELECT * FROM users;')
						.on('row', function(row) {
							console.log('Row Id: ' + row.id);
							console.log(JSON.stringify(row));
							var uId = row.id;
							var u = {
								"id" :			row.id,
								"name" :		row.name,
								"img_url" :		row.img_url,
								"destiny_name" :row.destiny_name,
								"bungie_id" :	row.bungie_id
							};
							users[uId] = u;
							uIn[uId] = u;
							uOut[uId] = u;
						});
						
		query.on('end', function() {
			done();
			// return results;
			console.log('Done...');
			console.log('Done Method: Users:' + JSON.stringify(users));
			console.log('Done Method: uIn:' + (uIn) ? JSON.stringify(uIn) : " is null ");
			console.log('Done Method: uOut:' + (uOut) ? JSON.stringify(uOut)  : " is null ");
			if(setUsers) setUsers(users);
		});
	});
};

// id, name, img_url, destiny_name
module.exports.storeUsers = function(users) {
	console.log('Storing Users...');
	console.log(JSON.stringify(users, null, 2));
	pg.connect(process.env.DATABASE_URL, (err, client, done) => {
		// Handle connection errors
		if(err) {
			done();
			console.log(err);
			return res.status(500).json({success: false, data: err});
		}
		// select all ids
		var ids = [];
		var query = client
					.query('SELECT id FROM users;')
					.on('row', function(row) {
						ids[row.id] = 1;
					});
		// add each user, checkin id to store or insert
		query.on('end', () => {
			console.log('Select All Done...');
		
			for(key in users){
				if(key)	console.log('User: ' + JSON.stringify(key));
				if(key && users[key].id){
					var user = users[key];
					console.log('Storing... '  + user.id + ' ' + ids[user.id]);
						   
					if(ids[user.id]){
						console.log('Updating...');
						client.query('UPDATE users SET name=($1), img_url=($2), destiny_name=($3), bungie_id=($4) WHERE id=($5::varchar);',
							[user.name, user.img_url, user.destiny_name, user.bungie_id, user.id],
							function (err, result) {
								console.log('Update Full Complete...');
								if (err) {
								  return console.error('error during Full query: ', err)
								}
							}
					   );
					}else{
						console.log('Inserting...');
						client.query('INSERT INTO users(id, name, img_url, destiny_name, bungie_id) ' +
							'VALUES($1, $2, $3, $4, $5);',
							[user.id, user.name, user.img_url, user.destiny_name, user.bungie_id],
								function (err, result) {
									console.log('Insert Complete...');
									if (err) {
									  return console.error('error during query: ' + user.id, err)
									}
								}
						   );
					}
				
				}
			}
			
			return;
		});
		
	
		
	});
};

