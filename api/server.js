let express = require('express');
let fs = require('fs');
let bodyParser = require('body-parser');
let mongo = require('mongodb');
let multiparty = require('connect-multiparty');
let ObjectId = require('mongodb').ObjectId;

let app = express();

/* Body Parser */
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', "http://localhost:3000");
	res.setHeader('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE");	
	res.setHeader('Access-Control-Allow-Headers', "content-type");
	res.setHeader('Access-Control-Allow-Credentials', true);	

	next();
});

/* MongoDB */
let db = new mongo.Db(
	"instagram",
	new mongo.Server('localhost', 27017, {}),
	{}		
);

app.listen(8080, function () {
	console.log("API ONLINE!");
});

app.get('/', function (req, res) {
	res.send({msg:"Hello, I'm your API!"});
});

app.post('/api', function (req, res) {
	let date = new Date();
	let url_imagem = date.getTime() + "_" + req.files.arquivo.originalFilename;

	let path_temp = req.files.arquivo.path;
	let path_destino = "./uploads/" + url_imagem;

	fs.rename(path_temp, path_destino, function (err) {
		if (err) {
			res.status(500).json({erros : err});
			return;
		}

		let dados = {
			titulo : req.body.titulo,
			url_imagem : url_imagem
		};

		db.open(function (err, mongoclient) {
			mongoclient.collection('postagens', function (err, collection) {
				collection.insert(dados, function (err, result) {
					(err) ? res.json(err) : res.json("{status : 'Inclusão realizada com sucesso!'}");
					mongoclient.close();
				});
			});
		});
	});
});

app.get('/img/:img_name', function (req, res) {
	let img = req.params.img_name;
	fs.readFile('./uploads/' + img, function (err, content) {
		if (err) {
			console.log(err);
			res.status(400).send(err);
			return;
		}

		res.writeHead(200, {'content-type' : "image/jpg"});
		res.end(content);
	});
});

app.get('/api', function (req, res) {
	db.open(function (err, mongoclient) {
		mongoclient.collection('postagens', function (err, collection) {
			collection.find().toArray(function (err, result) {
				(err) ? res.json(err) : res.json(result);
				mongoclient.close();
			});
		});
	});
});

app.get('/api/:id', function (req, res) {
	db.open(function (err, mongoclient) {
		mongoclient.collection('postagens', function (err, collection) {
			collection.find({_id : ObjectId(req.params.id)}).toArray(function (err, result) {
				(err) ? res.json(err) : res.json(result);
				mongoclient.close();
			});
		});
	});
});

app.put('/api/:id', function (req, res) {
	db.open(function (err, mongoclient) {
		mongoclient.collection('postagens', function (err, collection) {
			collection.update(
				{_id : ObjectId(req.params.id)},
				{$push: {
							comentarios: 
								{
									id_comentario: new ObjectId(),
									comentario: req.body.comentario
								}
						} 
				},
				{},
				function (err, result) {
					(err) ? res.json(err) : res.json(result);
					mongoclient.close();
				}
			);
		});
	});
});

app.delete('/api/:id', function (req, res) {
	db.open(function (err, mongoclient) {
		mongoclient.collection('postagens', function (err, collection) {
			collection.update(
				{},
				{
					$pull: {
						comentarios: {id_comentario : ObjectId(req.params.id)}
					}
				},
				{multi: true},
				function (err, result) {
					(err) ? res.json(err) : res.json(result);
					mongoclient.close();
				}
			);	
		});
	});
});