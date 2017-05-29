var pg = require('pg');

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  // client
    // .query('SELECT table_schema,table_name FROM information_schema.tables;')
    // .on('row', function(row) {
      // console.log(JSON.stringify(row));
    // });
});

exports.getUsers = () => {
	users = [];
	results = getDBAction( () => {
		client
		.query('SELECT * FROM users;')
		.on('row', function(row) {
			console.log(JSON.stringify(row));
			users[row.id] = row;
	});});
	
	return users;
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
	pg.connect(connectionString, (err, client, done) => {
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
	pg.connect(connectionString, (err, client, done) => {
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