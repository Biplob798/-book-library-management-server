const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// middleware 

app.use(cors())
app.use(express.json())


// mongodb data base 



console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vsymadz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();



        //  data collection from mongodb 

        const booksCollection = client.db('bookLibrary').collection('books')


        // get data from mongodb 


        app.get('/books', async (req, res) => {
            const cursor = booksCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/allBooks', async (req, res) => {
            const cursor = booksCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })


        // addBook 



        // get data by category 
        // get data for dynamic brand route to show brand product

        app.get("/allBooks/:category", async (req, res) => {
            const category = req.params.category;
            console.log(category)
            const query = { category: category }
            const cursor = booksCollection.find(query);
            const result = await cursor.toArray(cursor);
            console.log(result)
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






app.get('/', async (req, res) => {
    res.send('Book Library is running')
})

app.listen(port, () => {
    console.log(`Book Library server is running on port ${port}`)
})