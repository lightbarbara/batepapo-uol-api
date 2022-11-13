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

        if (!name) {
            res.status(422).send('Name is blank!')
            return
        }

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

app.delete('/messages/:messageId', async (req, res) => {

    try {

        const user = req.headers.user
        const { messageId } = req.params

        const message = await db.collection('messages').findOne({ _id: messageId })

        if (!message) {
            res.status(404).send('No message with this id!')
            return
        }

        if (message.name !== user) {
            res.status(401).send('You are not allowed to delete this message!')
        }

        await db.collection('messages').deleteOne({ _id: messageId })

        res.status(200).send('Message deleted!')

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.put('/messages/:messageId', async (req, res) => {

    try {

        const { messageId } = req.params

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.post('/status', async (req, res) => {

    try {

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.listen(5000, () => console.log('Server running on port 5000'))