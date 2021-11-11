const { MongoClient } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();


const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.imuoa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri)

async function run() {
    try{
        await client.connect()
        console.log('Database connected successfully');
        const database = client.db('handcraft')
        const purchaseCollection = database.collection('purchase')


        app.get('/purchase', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email}            
            const cursor = purchaseCollection.find(query);           
            const appointments = await cursor.toArray();
            //  console.log(appointments)
            res.json(appointments)
        })

        // -----------test start--------------

        // app.get('/purchase', async(req, res) =>{
        //     const cursor = purchaseCollection.find({});
        //    //  const cursor = await productCollection.find({}).toArray();
        //    const product = await cursor.toArray();
        //    console.log(product);
        //    res.send(product);
        // });

        // ---------test end-----------

        app.post('/purchase', async(req, res) =>{
            const appointment = req.body;
            const result = await purchaseCollection.insertOne(appointment)
            res.json(result)

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