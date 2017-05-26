var express = require('express');
var request = require('request')
var bodyParser = require('body-parser')
var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

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

app.get('/', function(req, res) {
  res.render('pages/index2');
});

app.get('/c', function(req, res) {
  res.send('pages/index2');
});

app.post('/dead', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  res.send('welcome, ' + req.body.command)
})

app.post('/d', urlencodedParser, function(req, res) {
	//+ req.params.join(",")
	
    if (!req.body) {
		return res.sendStatus(400);
	}
	parseText(req.body)
		
	  
	var concat = '';
	if(req.body){
		var reqBody = req.body;
		//reqBody.token
		//reqBody.command
		//text
		if(reqBody.response_url != null){concat += ' responseURL: ' + reqBody.response_url;}
		if(reqBody.token != null){concat += ' token: ' + reqBody.token;}
		if(reqBody.text != null){concat += ' text: ' + reqBody.text;}
		if(reqBody.command != null){concat += ' rb.command: ' + reqBody.command;}
		if(reqBody.json()){concat += ' rb.json(): ' + reqBody.json();}
		
		if(reqBody + "concat"){concat += ' rbconcat: ' + reqBody;}
	}else{
		concat += ' NO BODY ';
	}
	
	
    res.send('data c: ' + concat  );
});

// https://polar-island-85982.herokuapp.com/button-endpoint

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


