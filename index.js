const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const conn = mongoose.connect(process.env['DB_URI'])
  .then(() => console.log('connected to db'))
  .catch(console.log)

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [{
    type: {
      description: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        required: true,
      },
      date: {
        type: String,
        default: new Date().toDateString()
      }
    },
    default: []
  }]
})


const User = mongoose.model('User', userSchema)
const error = { error: 'An errorrr' }

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  new User({ username }).save((err, data) => {
    if (err) return res.json(error);
    return res.json({ username: data.username, _id: data._id });
  })
})

app.get('/api/users', (req, res) => {
  User.find({}).select({ username: 1, _id: 1 }).exec((err, data) => {
    if (err) return res.json(error)
    return res.json(data)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const exercise = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date || new Date().toDateString()
  }
  console.log(exercise)
  User.findByIdAndUpdate(req.params._id, { $push: { log: exercise } }, (err, data) => {
    if (err) return res.json(error)
    return res.json({
      _id: data._id,
      username: data.username,
      ...exercise
    })
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  User.findById(_id).select({ _id: 1, username: 1, log: 1 }).exec((err, data) => {
    if (err) return res.json(error)
    return res.json({
      ...data._doc,
      count: data.log.length
    })
  })
})


const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
