var express = require('express');
var app = express();

// var bodyParser = require('body-parser')
// app.use(bodyParser.json());       // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  // extended: true
// })); 
// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index2');
});

app.get('/c', function(request, response) {
  response.send('pages/index2');
});

app.post('/d', function(req, res) {
	//+ req.params.join(",")
	var concat = '';
	var q = req.query;
	if(q != null){concat += ' query: ' + q;}
	
	
	var cm = req.query.command;
	if(cm != null){concat += ' command: ' + cm;}
	
	var p = req.path;
	if(p != null){concat += ' path: ' + p;}
	
	
	// var pr = req.param();
	//if(pr != null){concat += ' param: ' + pr;}
    res.send('pages/index2 c: ' + concat  +  ' b: ' + req.body);
});

// https://polar-island-85982.herokuapp.com/button-endpoint

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


