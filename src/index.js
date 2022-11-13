import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'

const app = express()
app.use(cors())
app.use(express.json())
const mongoClient = new MongoClient('mongodb://localhost:27017')
let db

mongoClient.connect()
    .then(() => {
        db = mongoClient.db('bate-papo-uol')
    })
    .catch(err => console.log(err))

app.post('/participants', (req, res) => {

    const { name } = req.body

    db.collection('participants').insert({
        'name': name,
        'lastStatus': Date.now()
    })
        .then(response => {
            res.status(201).send('User created!')
        })
        .catch(err => {
            res.status().send()
        })

})

app.get('/participants', (req, res) => {

    db.collection('participants')
        .find()
        .toArray()
        .then(participants => {
            res.send(participants)
        })
        .catch(err => {
            res.sendStatus(500)
        })
})

app.post('/messages', (req, res) => {

})

app.get('/messages', (req, res) => {

})

app.post('/status', (req, res) => {

})

app.listen(5000, () => console.log('Server running on port 5000'))