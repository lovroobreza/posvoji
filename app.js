//imports
const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const flash = require('connect-flash')
const Dog = require('./models/dogs')


const catchAsync = require('./public/javascript/CatchAsync')
const ExpressError = require('./public/javascript/ExpressError')

const validateDog = require('./public/javascript/Joi')
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

// flash

//sessions
const sessionConfig={
    secret: 'hay',
    resave:false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 *7,
        maxAge: 1000 * 60 * 60 * 24 *7,
    }
}

app.use(session( sessionConfig))

//flash
app.use(flash())

app.use((req,res,next)=>{
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})


//routes
app.get('/', (req,res)=>{
    res.render('home')
})

//show all dogs
app.get('/dogs', catchAsync(async(req,res) => {
    const dogs = await Dog.find({})
    res.render('dogs/index', { dogs })
}))

//POST NEW DOG
app.get('/dogs/new', (req,res)=>{
    res.render('dogs/new')
})

app.post('/dogs', validateDog, catchAsync(async(req,res, next)=>{
    const dog = new Dog(req.body.dog)
    await dog.save()
    req.flash('success', 'Successfully publish your puppy')
    res.redirect(`/dogs/${dog._id}`)
}))

//SHOW SINGLE DOG
app.get('/dogs/:id', catchAsync(async(req,res) => {
    const {id} = req.params
    const dog = await Dog.findById(id)
    res.render('dogs/details', { dog })
}))

//EDIT SINGLE DOG
app.get('/dogs/:id/edit', catchAsync(async(req,res) => {
    const {id} = req.params
    const dog = await Dog.findById(id)
    
    res.render('dogs/edit', { dog })
}))

app.put('/dogs/:id', validateDog, catchAsync(async(req,res)=>{ 
    if(!req.body.dog) throw new ExpressError('Invalid try buddy', 400)
    const {id} = req.params
    const updatedDog = await Dog.findByIdAndUpdate(id, {...req.body.dog})
    updatedDog.save()
    res.redirect(`/dogs/${updatedDog._id}`)
}))

//delete a doggie = succesfully adopted
app.delete('/dogs/:id', catchAsync(async(req,res)=>{
    const {id} = req.params
    await Dog.findByIdAndDelete(id)
    res.redirect('/dogs') 
}))

app.all('*', (req,res,next) =>{
    next(new ExpressError('Page not found', 404))
})

app.use((err,req,res,next) => {
    const { statusCode=500} = err
    if(!err.message) err.message = "something went wrong"
    res.status(statusCode).render('error/error', {err})
})

app.listen(3000, () => console.log('Listening on port: 3000'))