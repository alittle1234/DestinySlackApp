var pg = require('pg');
pg.defaults.ssl = true;


module.exports.getUsers = function() {
	var usersa = [];
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
							usersa[row.id] = row;
						});
		
		
		
		// After all data is returned, close connection and return results
		
		console.log('Finish...');
		query.on('end', function() {
			done();
			// return results;
			console.log('Done...');
			console.log('Done Method: ' + JSON.stringify(usersa));
		});
	});
	
	console.log('DB Method: ' + JSON.stringify(usersa));
	return usersa;
};

// id, name, img_url, destiny_name
exports.storeUsers = (users) => {
	for(var i = 0; i < users.length; i++){
		setDBAction( () =>{
		client
			.query('SELECT id FROM FROM users where id='+users[i].id+';')
			.on('row', function(row) {
			   if(row && row.id == users[i].id){
					updateUser(users[i]);
			   }else{
					insertUser(users[i]);
			   }
			});
		});
	}
};

function insertUser(user){
	setDBAction( () =>{
	client.query('INSERT INTO users(id, name, img_url, destiny_name) ' +
		'values($1, $2, $3, $4)',
		[user.id, user.name, user.img_url, user.destiny_name]);
	});
}

function updateUser(user){
	setDBAction( () =>{
	client.query('UPDATE items SET name=($1), img_url=($2), destiny_name=($3) WHERE id=($4)',
		[user.name, user.img_url, user.destiny_name, user.id]);
	});
}

function getDBAction(queryMethod){
	pg.connect(process.env.DATABASE_URL, (err, client, done) => {
		const results = [];
		// Handle connection errors
		if(err) {
			done();
			console.log(err);
			return res.status(500).json({success: false, data: err});
		}
		
		// SQL Query > Select Data
		const query = queryMethod();
		// Stream results back one row at a time
		query.on('row', (row) => {
			results.push(row);
		});
		
		// After all data is returned, close connection and return results
		query.on('end', () => {
			done();
			return results;
		});
	});
}

function setDBAction(queryMethod){
	pg.connect(process.env.DATABASE_URL, (err, client, done) => {
		// Handle connection errors
		if(err) {
			done();
			console.log(err);
			return res.status(500).json({success: false, data: err});
		}
		
		// SQL Query > Select Data
		const query = queryMethod();
		
		// After all data is returned, close connection and return results
		query.on('end', () => {
			done();
			return;
		});
	});
}