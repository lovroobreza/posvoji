const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DogSchema = new Schema({
    name: String,
    age: Number,
    breed: String,
    description: String,
    images: [{
        url: String,
        filename: String
    }],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('Dog', DogSchema)