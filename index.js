const { MongoClient } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();


const port = process.env.PORT || 5000;

// handcraft-firebase-adminsdk.json
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const serviceAccount = require('./handcraft-firebase-adminsdk.json');
// console.log(serviceAccount);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.imuoa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri)

async function verifyToken (req, res, next){
    if (req.headers?.authorization?. startsWith('Bearer ')){
        const token = req.headers.authorization.split(' ')[1];

        try{
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch{

        }
    }
    next();
}

async function run() {
    try{
        await client.connect()
        console.log('Database connected successfully');
        const database = client.db('handcraft')
        const purchaseCollection = database.collection('purchase')
        const usersCollection = database.collection('users');

        app.get('/purchase', verifyToken, async(req, res) =>{
            const email = req.query.email;
            const query = { email: email }
            console.log(query);            
            const cursor = purchaseCollection.find(query);           
            const appointments = await cursor.toArray();
            //  console.log(appointments)
            res.json(appointments)
        })
      
        // -----------test start--------------
        // ---------test end-----------

        app.post('/purchase', async(req, res) =>{
            const appointment = req.body;
            const result = await purchaseCollection.insertOne(appointment)
            res.json(result)

        })

        app.get('/users/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email: email}
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if(user?.role === 'admin'){
                isAdmin = true;
            }
            res.json({admin: isAdmin});
        })

        app.post('/users', async(req, res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result)
            res.json(result);
        })

        app.put('/users', async(req, res) =>{
            const user = req.body;
            const filter = {email: user.email}
            const options = {upsert: true}
            const updateDoc = {$set: user}
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        });

        app.put ('/users/admin', verifyToken, async (req, res) =>{
            const user = req.body;
            // console.log('decodedEmail', req.decodedEmail);
            const requester = req.decodedEmail;

            if(requester){
                const requesterAccount = await usersCollection.findOne({email: requester});
                if(requesterAccount.role === 'admin'){
                    const filter = { email: user.email}
                    const updateDoc = {$set: {role: 'admin'}}
                    const result = await usersCollection.updateOne(filter, updateDoc)
                    res.json(result);
                }
            }
              else {
                  res.status(401).json ({message: 'You can not add a Admin'})
              }         
        })
    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('From Handcraft Backend Server')
})

app.listen(port, () => {
    console.log(`Server runing properly-${port}`)
})