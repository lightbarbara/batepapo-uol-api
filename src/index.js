import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import joi from 'joi'

const participantSchema = joi.object({
    name: joi.string().required().max(30)
})

const messageSchema = joi.object({
    to: joi.string().required().max(30),
    text: joi.string().required().max(100),
    type: joi.string().required().max(30)
})

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

        const validation = participantSchema.validate(req.body, {abortEarly: false})

        if (validation.error) {
            const errors = validation.error.details.map(detail => detail.message)
            res.status().send(errors)
            return
        }

        await db.collection('participants').insert({
            'name': name,
            'lastStatus': Date.now()
        })

        res.status(201).send({message: 'User created!'})

    } catch (err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }

})

app.get('/participants', async (req, res) => {

    try {
        const participants = await db.collection('participants').find().toArray()

        res.status(200).send(participants)

    } catch (err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }

})

app.post('/messages', async (req, res) => {

    try {

    } catch (err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }

})

app.get('/messages', async (req, res) => {

    try {

        const { limit } = Number(req.query)

        const messages = await db.collection('messages').find().toArray()

        res.status(200).send(messages)

    } catch (err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }

})

app.delete('/messages/:messageId', async (req, res) => {

    try {

        const user = req.headers.user
        const { messageId } = req.params

        const message = await db.collection('messages').findOne({ _id: ObjectId(messageId) })

        // if (!message) {
        //     res.status(404).send({message: 'No message with this id!'})
        //     return
        // }

        // if (message.name !== user) {
        //     res.status(401).send({message: 'You are not allowed to delete this message!'})
        // }

        await db.collection('messages').deleteOne({ _id: ObjectId(messageId) })

        res.status(200).send({message: 'Message deleted!'})

    } catch (err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }

})

app.put('/messages/:messageId', async (req, res) => {

    try {

        const { messageId } = req.params

    } catch (err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }

})

app.post('/status', async (req, res) => {

    try {

    } catch (err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }

})

app.listen(5000, () => console.log('Server running on port 5000'))