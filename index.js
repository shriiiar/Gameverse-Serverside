const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log("gg", authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    console.log(authHeader);
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

const uri = "mongodb+srv://reviewsA9:ifU3CqsehujJQiyB@cluster0.vftdj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        console.log('Connected..');
        await client.connect();
        const photosCollection = client.db('Wildverse').collection('photos');
        const packagesCollection = client.db('Wildverse').collection('packages');
        const orderCollection = client.db('Wildverse').collection('order');

        //Auth JWT Token
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        // Size And Page For Pagination
        app.get('/photos', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = photosCollection.find(query);
            let products;
            if (page || size) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            // const products5 = await cursor.limit(5).toArray(); to show only 5 data 
            res.send(products);
        });

        app.get('/packages', async (req, res) => {
            const query = {};
            const cursor = packagesCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        app.get('/photos/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const game = await photosCollection.findOne(query);
            res.send(game);
        })

        // POST Game : Adding a game to the Database
        app.post('/photos', async (req, res) => {
            const newGame = req.body;
            console.log('Adding New Game', newGame);
            const result = await photosCollection.insertOne(newGame);
            res.send(result)
        });


        // delete a game from db
        app.delete('/photos/:id', async (req, res) => {
            const id = req.params.id;
            const deleteItem = req.body;
            console.log('Deleting Item', deleteItem, id);
            const query = { _id: ObjectId(id) };
            const result = await photosCollection.deleteOne(query);
            res.send(result);
        })


        // For pagination
        app.get('/photosCount', async (req, res) => {
            const count = await photosCollection.estimatedDocumentCount();
            res.send({ count });
        })

        // use post to get products by ids
        // app.post('/productByKeys', async (req, res) => {
        //     const keys = req.body;
        //     const ids = keys.map(id = ObjectId(id))
        //     const query = { _id: { $in: ids } };
        //     const cursor = photosCollection.find(query);
        //     const products = await cursor.toArray();
        //     res.send(products);
        // })

        // Order Collection Api With JWT
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })

        // Order DB
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/hero', (req, res) => {
    res.send('Heroku Running');
})

app.get('/', (req, res) => {
    res.send('Server Is Running..');
})

app.listen(port, () => {
    console.log('Listening..');
})