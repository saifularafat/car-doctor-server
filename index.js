const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken')
const port = process.env.PORT || 4000;

//middleware
app.use(cors())
app.use(express.json())

// console.log(process.env.DB_USER, process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.guqonkt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// JWT Verify code 
const verifyJWT = (req, res, next) => {
    console.log('hitting verify JWT');
    console.log(req.headers.authorization);
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({ error: true, message: 'unAuthorization access'})
    } 
    const token = authorization.split(' ')[1];
    console.log('token inside verify JWT', token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if(error){
            return res.status(403).send({ error: true, message: 'unAuthorization access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('bookings');

        app.post('/jwt', async(req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({token})
            console.log(token);
        })

        //service server site code
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };
            const result = await serviceCollection.findOne(query, options)
            res.send(result)
        })

        // bookings query sum account of details
        // app.get('/bookings/:email', async(req, res) => {
        app.get('/bookings', verifyJWT, async (req, res) => {
            // console.log(req.headers.authorization);
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
                return res.status(403).send({ error: 1, message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        //booking server site one items database and client site data gon code 
        app.post('/bookings', async (req, res) => {
            const bookings = req.body;
            const result = await bookingCollection.insertOne(bookings)
            res.send(result)
            console.log(bookings);
        })

        // booking server site Update code
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateBookings = req.body;
            const updateDoc = {
                $set: {
                    status: updateBookings.status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result)
            console.log(updateBookings);
        })

        // S@iful#*21SA

        //booking server site one items delete [ DELETE ]
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Car Doctor Server is Running')
})

app.listen(port, () => {
    console.log(`Car Doctor Server running on port ${port}`);
})