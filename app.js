//imports
const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const Dog = require('./models/dogs')

//mongose connection
mongoose.connect('mongodb://localhost:27017/posvoji', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
db.once('open', ()=>{
    console.log('database connected');
})

//middleware and express set
app.use(express.static('public'))

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use(methodOverride('_method'))


//routes
app.get('/', (req,res)=>{
    res.render('home')
})

//show all dogs
app.get('/dogs', async(req,res) => {
    const dogs = await Dog.find({})
    res.render('dogs/index', { dogs })
})

//POST NEW DOG
app.get('/dogs/new', (req,res)=>{
    res.render('dogs/new')
})

app.post('/dogs', async(req,res)=>{
    const dog = new Dog(req.body.dog)
    await dog.save()
    res.redirect(`/dogs/${dog._id}`)
})

//SHOW SINGLE DOG
app.get('/dogs/:id', async(req,res) => {
    const {id} = req.params
    const dog = await Dog.findById(id)
    res.render('dogs/details', { dog })
})

//EDIT SINGLE DOG
app.get('/dogs/:id/edit', async(req,res) => {
    const {id} = req.params
    const dog = await Dog.findById(id)
    
    res.render('dogs/edit', { dog })
})

app.put('/dogs/:id', async(req,res)=>{ 
    const {id} = req.params
    const updatedDog = await Dog.findByIdAndUpdate(id, {...req.body.dog})
    updatedDog.save()
    res.redirect(`/dogs/${updatedDog._id}`)
})

//delete a doggie = succesfully adopted
app.delete('/dogs/:id', async(req,res)=>{
    const {id} = req.params
    await Dog.findByIdAndDelete(id)
    res.redirect('/dogs') 
})

app.listen(3000, () => console.log('Listening on port: 3000'))