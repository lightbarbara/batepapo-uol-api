import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

const app = express()
app.use(cors())
app.use(express.json())
dotenv.config()
const mongoClient = new MongoClient(process.env.MONGO_URI)
let db

try {
    await mongoClient.connect()
    db = mongoClient.db('bate-papo-uol')
    
} catch (err) {
    console.log(err)
}

app.post('/participants', async (req, res) => {

    try {
        const { name } = req.body

        await db.collection('participants').insert({
            'name': name,
            'lastStatus': Date.now()
        })

        res.status(201).send('User created!')

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get('/participants', async (req, res) => {

    try {
        const participants = await db.collection('participants').find().toArray()

        res.status(200).send(participants)

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.post('/messages', async (req, res) => {
    
})

app.get('/messages', async (req, res) => {

    try {
        const { limit } = Number(req.query)

        const messages = await db.collection('messages').find().toArray()

        res.status(200).send(messages)

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.post('/status', async (req, res) => {

})

app.listen(5000, () => console.log('Server running on port 5000'))