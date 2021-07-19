const express = require('express'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectId,
    fs = require('fs')

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multiparty());

app.use(function (req, res, next) {

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
    res.setHeader("Access-Control-Allow-Headers", "content-type")
    res.setHeader("Access-Control-Allow-Credentials", true)

    next()
})

const port = 8080

app.listen(port)
console.log('Servidor HTTP esta executando na porta ' + port)

const db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
)

app.get('/', function (req, res) {
    res.send('hello world')
});

// POST (create)
app.post('/api', function (req, res) {

    const date = new Date()
    time_stamp = date.getTime()

    let url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename

    const path_origem = req.files.arquivo.path
    const path_destino = './uploads/' + url_imagem


    fs.rename(path_origem, path_destino, function (err) {
        if (err) {
            res.status(500).json({ error: err })
            return
        }

        const dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }

        db.open(function (err, mongoclient) {
            mongoclient.collection('postagens', function (err, collection) {
                collection.insert(dados, function (err, records) {
                    if (err) {
                        res.json({ 'status': 'erro' })
                    } else
                        res.json({ 'status': 'inclusao realizada com sucesso' })
                })
                mongoclient.close()
            })
        })
    })
});

// GET (ready)
app.get('/api', function (req, res) {

    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find().toArray(function (err, results) {
                if (err) {
                    res.json(err)
                } else
                    res.json(results)
            })
            mongoclient.close()
        })
    })
});

app.get('/imagens/:imagem', function (req, res) {

    var img = req.params.imagem

    fs.readFile('./uploads/' + img, function (err, content) {
        if (err) {
            res.status(400).json(err)
            return
        }

        res.writeHead(200, { 'content-type': 'image/jpg' })
        res.end(content)
    })
});

// GET by ID (ready)
app.get('/api/:id', function (req, res) {
    const id = req.params.id;

    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find(objectId(id)).toArray(function (err, results) {
                if (err) {
                    res.json(err)
                } else
                    res.json(results)
            })
            mongoclient.close()
        })
    })
});

// PUT by ID (update)
app.put('/api/:id', function (req, res) {

    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.update(
                { _id: objectId(req.params.id) },
                {
                    $push: {
                        comentarios: {
                            id_comentario: new objectId(),
                            comentario: req.body.comentario
                        }
                    }
                },
                {},
                function (err, records) {
                    if (err) {
                        res.json(err)
                    } else
                        res.json(records)

                    mongoclient.close()
                }
            )
        })
    })
});

// Delete by ID
app.delete('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.update(
                {},
                {
                    $pull: {
                        comentarios: {
                            id_comentario: new objectId(req.params.id),
                        }
                    }
                },
                { multi: true },
                function (err, records) {
                    if (err) {
                        res.json(err)
                    } else
                        res.json(records)

                    mongoclient.close()
                }
            )
        })
    })
});