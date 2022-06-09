const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_DB)
  .then(() => console.log('db connected'))
  .catch(console.log)

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})

const exerciseSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
})

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)
const handleError = (err, res) => res.json({ error: err.message })

app.post('/api/users/', (req, res) => {
  new User(req.body).save()
    .then(data => res.json(data))
    .catch(err => handleError(err, res))
})

app.get('/api/users', (req, res) => {
  User.find().select('username _id').exec()
    .then(data => res.json(data))
    .catch(err => handleError(err, res))
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body
  User.findById(req.params._id).select('username _id').exec()
    .then(user => {
      new Exercise({ userId: user._id, description, duration, date: date || new Date() }).save()
        .then(ex => res.json({ ...user._doc, description, duration: ex.duration, date: ex.date.toDateString() }))
        .catch(err => handleError(err, res))
    })
    .catch(err => handleError(err, res))
})

app.get('/api/users/:_id/logs', (req, res) => {
  console.log(req.query);
  const { _id: id } = req.params
  let from, to, limit = parseInt(req.query.limit);
  if (req.query.from)
    from = new Date(req.query.from)
  else from = new Date(0)
  if (req.query.to)
    to = new Date(req.query.to)
  else to = new Date()
  if (isNaN(limit)) limit = 10000;

  User.findById(id).select('username _id').exec()
    .then(user => {
      Exercise.find({ userId: id }).where('date').gte(from).lte(to)
        .limit(limit).select('description duration date -_id').exec()
        .then(exs => {
          const exd = exs.map(ex => ({ ...ex._doc, date: ex.date.toDateString() }))
          console.log({ ...user._doc, count: exs.length, log: exd })
          return res.json({ ...user._doc, count: exs.length, log: exd })
        })
        .catch(err => handleError(err, res))
    })
    .catch(err => handleError(err, res))
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
