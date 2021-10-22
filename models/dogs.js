const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DogSchema = new Schema({
    name: String,
    age: Number,
    breed: String,
    description: String
})

module.exports = mongoose.model('Dog', DogSchema)