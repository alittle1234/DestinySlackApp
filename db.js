var pg = require('pg');
pg.defaults.ssl = true;


module.exports.getUsers = function(users, setUsers) {
	//var usersa = [];
	console.log('Get Users...');
	
	
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		console.log('Connecting...');
		const results = [];
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
							users[row.id] = row;
						});
		
		
		
		// After all data is returned, close connection and return results
		
		console.log('Finish...');
		query.on('end', function() {
			done();
			// return results;
			console.log('Done...');
			console.log('Done Method: ' + JSON.stringify(users));
			setUsers();
		});
	});
};

// id, name, img_url, destiny_name
module.exports.storeUsers = function(users) {
	pg.connect(process.env.DATABASE_URL, (err, client, done) => {
		// Handle connection errors
		if(err) {
			done();
			console.log(err);
			return res.status(500).json({success: false, data: err});
		}
		
		var query;
		
		for(var i = 0; i < users.length; i++){
			if(users[i] && users[i].id){
				var user = users[i];
				console.log('Storing...');
				query = client
					.query('SELECT id FROM users WHERE id='+user.id+';')
					.on('row', function(row) {
					   if(row && row.id == user.id){
							console.log('Updating...');
							client.query('UPDATE users SET name=($1), img_url=($2), destiny_name=($3) WHERE id=($4)',
								[user.name, user.img_url, user.destiny_name, user.id]);
					   }else{
							console.log('Inserting...');
							client.query('INSERT INTO users(id, name, img_url, destiny_name) ' +
								'VALUES($1, $2, $3, $4)',
								[user.id, user.name, user.img_url, user.destiny_name]);
					   }
					});
			
			}
		}
		
		if(query){
			query.on('end', () => {
				done();
				console.log('exports.storeUsers Done...');
				return;
			});
		}
		
	});
};

