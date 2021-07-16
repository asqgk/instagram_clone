const express = require('express'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectId,
    fs = require('fs')

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multiparty());

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
    res.setHeader("Access-Control-Allow-Origin", "*")

    const date = new Date()
    time_stamp = date.getTime()

    let url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename

    const path_origem = req.files.arquivo.path
    const path_destino = './uploads/' + url_imagem
    

    fs.rename(path_origem, path_destino, function (err) {
        if (err) {
            res.status(500).json({error: err})
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
                        res.json({'status' : 'inclusao realizada com sucesso'})
                })
                mongoclient.close()
            })
        })
    })   
});

// GET (ready)
app.get('/api', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*")

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
                { $set: { titulo: req.body.titulo, url_imagem: req.body.url_imagem } },
                {},
                function (err, records) {
                    if (err) {
                        res.json(err)
                    } else
                        res.json(records)
                })
            mongoclient.close()
        })
    })
});

// Delete by ID (remove)
app.delete('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.remove({ _id: objectId(req.params.id) }, function (err, records) {
                if (err) {
                    res.json(err)
                } else
                    res.json(records)
            })
            mongoclient.close()
        })
    })
});