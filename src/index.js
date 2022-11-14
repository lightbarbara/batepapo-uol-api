import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import joi from 'joi'
import dayjs from 'dayjs'
import { stripHtml } from 'string-strip-html'

const participantSchema = joi.object({
    name: joi.string().required().max(30)
})

const messageSchema = joi.object({
    to: joi.string().required().max(30),
    text: joi.string().required().max(100),
    type: joi.string().required().valid('message', 'private_message')
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

setInterval(async () => {

    try {
        const interval = new Date() - 1000
        const participants = await db.collection('participants').find().toArray()
        if (participants.length === 0) {
            return
        }
        const removedParticipants = await db.collection('participants').find({ lastStatus: { $lte: interval } }).toArray()
        await db.collection('participants').deleteMany({ lastStatus: { $lte: interval } })

        if (removedParticipants) {
            removedParticipants.map(r => {
                db.collection('messages').insert({
                    'from': r.name,
                    'to': 'Todos',
                    'text': 'sai da sala...',
                    'type': 'status',
                    'time': dayjs().format('HH:mm:ss')
                })
            })
        }

    } catch (err) {
        console.log(err)
    }
}, 15000)

app.post('/participants', async (req, res) => {

    try {

        let { name } = req.body
        name = stripHtml(name).result.trim()

        const validation = participantSchema.validate(req.body, { abortEarly: false })

        if (validation.error) {
            const errors = validation.error.details.map(detail => detail.message)
            res.status(422).send(errors)
            return
        }

        const participant = await db.collection('participants').findOne({ 'name': name })

        if (participant) {
            res.status(409).send({ message: 'User already exists.' })
            return
        }

        await db.collection('participants').insert({
            'name': name,
            'lastStatus': Date.now()
        })

        await db.collection('messages').insert({
            'from': name,
            'to': 'Todos',
            'text': 'entra na sala...',
            'type': 'status',
            'time': dayjs().format('HH:mm:ss')
        })

        res.status(201).send({ message: 'User created!' })

    } catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

})

app.get('/participants', async (req, res) => {

    try {
        const participants = await db.collection('participants').find().toArray()

        res.status(200).send(participants)

    } catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

})

app.post('/messages', async (req, res) => {

    try {

        let { to, text, type } = req.body
        to = stripHtml(to).result.trim()
        text = stripHtml(text).result.trim()
        type = stripHtml(type).result.trim()

        let { user } = req.headers
        user = stripHtml(user).result.trim()

        const participant = await db.collection('participants').findOne({ 'name': user })

        if (!participant) {
            res.status(422).send({ message: 'User not a participant.' })
            return
        }

        const validation = messageSchema.validate({ to, text, type }, { abortEarly: false })

        if (validation.error) {
            const errors = validation.error.details.map(detail => detail.message)
            res.status(422).send(errors)
            return
        }

        await db.collection('messages').insert({
            'from': user,
            'to': to,
            'text': text,
            'type': type,
            'time': dayjs().format('HH:mm:ss')
        })

    } catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

    res.status(201).send({ message: 'Message sent.' })

})

app.get('/messages', async (req, res) => {

    try {

        let { limit } = req.query

        let { user } = req.headers
        user = stripHtml(user).result.trim()

        let messages = await db.collection('messages').find({ $or: [{ type: 'message' }, { from: user }, { to: user }, { to: 'Todos' }] }).toArray()
        messages = messages.reverse()

        if (limit) {
            limit = stripHtml(limit).result.trim()
            limit = Number(limit)
            messages = await db.collection('messages').find().toArray()
            messages = messages.slice(-limit).reverse()
        }

        res.status(200).send(messages)

    } catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

})

app.delete('/messages/:messageId', async (req, res) => {

    try {

        let user = req.headers.user
        user = stripHtml(user).result.trim()

        let { messageId } = req.params
        messageId = stripHtml(messageId).result.trim()

        const message = await db.collection('messages').findOne({ _id: ObjectId(messageId) })

        if (!message) {
            res.status(404).send({ message: 'No message with this id!' })
            return
        }

        if (message.from !== user) {
            res.status(401).send({ message: 'You are not allowed to delete this message!' })
            return
        }

        await db.collection('messages').deleteOne({ _id: ObjectId(messageId) })

        res.status(200).send({ message: 'Message deleted!' })

    } catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

})

app.put('/messages/:messageId', async (req, res) => {

    try {

        let { to, text, type } = req.body
        to = stripHtml(to).result.trim()
        text = stripHtml(text).result.trim()
        type = stripHtml(type).result.trim()

        let { messageId } = req.params
        messageId = stripHtml(messageId).result.trim()

        let { user } = req.headers
        user = stripHtml(user).result.trim()

        const message = await db.collection('messages').findOne({ '_id': ObjectId(messageId) })

        if (!message) {
            res.status(404).send({ message: 'Message not found.' })
            return
        }

        if (user !== message.from) {
            res.status(401).send({ message: 'You are not allowed to edit this message.' })
            return
        }

        const participant = await db.collection('participants').findOne({ 'name': user })

        if (!participant) {
            res.status(422).send({ message: 'User not a participant.' })
            return
        }

        const validation = messageSchema.validate({ to, text, type }, { abortEarly: false })

        if (validation.error) {
            const errors = validation.error.details.map(detail => detail.message)
            res.status(422).send(errors)
            return
        }

        await db.collection('messages').updateOne({ '_id': ObjectId(messageId) }, {
            $set: {
                'from': user,
                'to': to,
                'text': text,
                'type': type
            }
        })

    } catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

    res.status(201).send({ message: 'Message updated.' })

})

app.post('/status', async (req, res) => {

    try {

        let { user } = req.headers
        user = stripHtml(user).result.trim()

        const participant = await db.collection('participants').findOne({ name: user })

        if (!participant) {
            res.status(404).send({ message: 'User not a participant.' })
            return
        }

        await db.collection('participants').updateOne({ name: user }, {
            $set: {
                'name': user,
                'lastStatus': Date.now()
            }
        })

        res.status(200).send('Status updated.')

    } catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }

})

app.listen(5000, () => console.log('Server running on port 5000'))