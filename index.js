const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// middleware 

app.use(cors({
    origin: [
        'http://localhost:5173', 'http://localhost:5174'
    ],
    credentials: true
}))
app.use(express.json())

app.use(cookieParser())



//  create middleware logger 

const logger = async (req, res, next) => {
    console.log('log:info', req.host, req.originalUrl)
    next()
}



//  create middleware verify

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token
    console.log('value of token in middleware', token)
    // no token available
    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
    }

    // jwt verify 

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        // err 
        if (err) {
            console.log(err)
            return res.status(401).send({ message: 'unauthorized access' })
        }
        console.log('value in the token', decoded)
        req.user = decoded
        next()
    })
}


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
        const addBooksCollection = client.db('bookLibrary').collection('addBooks')
        const addBorrowBooksCollection = client.db('bookLibrary').collection('borrowBooks')




        // auth related api 

        // for login user 

        app.post('/jwt', logger, async (req, res) => {
            const user = req.body
            console.log('user for token', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            }).send({ success: true })
        })

        // logout user 
        app.post('/logout', async (req, res) => {
            const user = req.body
            console.log('user for token delete', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })











        // server related api 
        // get data from mongodb 


        app.get('/books', async (req, res) => {
            const cursor = booksCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // use jwt verify

        // app.get('/allBooks', logger, verifyToken, async (req, res) => {
        //     console.log(req.query.email)
        //     console.log('cook cook owner', req.user)
        //     if (req.user.email !== req.query.email) {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }
        //     let query = {}
        //     if (req.query?.email) {
        //         query = { email: req.query.email }
        //     }
        //     const cursor = booksCollection.find(query)
        //     const result = await cursor.toArray()
        //     res.send(result)
        // })

        app.get('/allBooks', async (req, res) => {
            const cursor = booksCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // all book api for pagination



        app.get('/allBooksCount', async (req, res) => {
            const count = await booksCollection.estimatedDocumentCount()
            res.send({ count })
        })

        // addBook 

        // get data by category 
        // get data for dynamic category route to show category book

        app.get("/allBooks/:category", async (req, res) => {
            const category = req.params.category;
            console.log(category)
            const query = { category: category }
            const cursor = booksCollection.find(query);
            const result = await cursor.toArray(cursor);
            console.log(result)
            res.send(result)
        })


        // get data by id for read book 

        app.get('/allBooks/readBook/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await booksCollection.findOne(query)
            res.send(result)
            console.log(result)
        })
        //  get data for dynamic id route to show category book

        app.get('/allBooks/books/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await booksCollection.findOne(query)
            res.send(result)
            console.log(result)
        })
        //  get data for dynamic id route to show update book

        app.get('/allBooks/update/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await booksCollection.findOne(query)
            res.send(result)
            console.log(result)
        })


        // post add book collection 
        // jwt verify 
        app.post('/addBooks', verifyToken, logger, async (req, res) => {
            console.log(req.query.email)
            console.log('cook cook', req.cookies)
            const addBooks = req.body
            console.log(addBooks)
            const result = await addBooksCollection.insertOne(addBooks)
            res.send(result)

        })

        // get user some data from borrow book 


        app.get('/borrowBook', async (req, res) => {
            console.log(req.query.email)
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await addBorrowBooksCollection.find(query).toArray()
            res.send(result)
        })

        // post borrow book 

        app.post('/borrowBook', async (req, res) => {
            const borrowBook = req.body
            console.log(borrowBook)
            const result = await addBorrowBooksCollection.insertOne(borrowBook)
            res.send(result)

        })

        // update data by put method 

        app.put('/allBooks/update/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateBook = req.body;
            const book = {
                $set: {
                    name: updateBook.name,
                    category: updateBook.category,
                    author: updateBook.author,
                    rating: updateBook.rating,
                    image: updateBook.image,
                },
            };
            const result = await booksCollection.updateOne(
                filter,
                book,
                options
            );
            res.send(result);

        })


        // delete borrow book 

        app.delete('/borrowBook/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await addBorrowBooksCollection.deleteOne(query)
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