if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//imports
const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const passportLocal = require('passport-local')
const mongoSanitaize = require('express-mongo-sanitize')
const helmet = require('helmet')
const MongoStore = require('connect-mongo');

//cloudinary
const multer = require('multer')
const { cloudinary, storage } = require('./cloudinary/config')
const upload = multer({ storage })

const Dog = require('./models/dogs')
const User = require('./models/user')

const catchAsync = require('./public/javascript/CatchAsync')
const ExpressError = require('./public/javascript/ExpressError')
const isLoggedIn = require('./public/javascript/middleware')

const validateDog = require('./public/javascript/Joi')

//mongose connection
const dbUrl='mongodb://localhost:27017/posvoji' 

mongoose.connect(process.env.DB_URL || dbUrl ,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
db.once('open', ()=>{
    console.log('database connected');
})

//middleware
app.use(express.static('public'))

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(mongoSanitaize({ replaceWith: '_'}))
app.use(methodOverride('_method'))
app.use(helmet({contentSecurityPolicy:false}))

//content security
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    'https://code.jquery.com/'
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dho9iurfh/", 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'"],
        },
    })
);

//sessions in mongo
const secret= process.env.SECRET || 'nononothisisntright'
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});

store.on("error", (e)=> {
    console.log("mongo store error", e)
})

const sessionConfig = {
    store,
    name: 'posvoji.session',
    secret,
    resave:false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        //secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 *7,
        maxAge: 1000 * 60 * 60 * 24 *7,
    }
}

app.use(session( sessionConfig))

//flash
app.use(flash())


//passport authentication
app.use(passport.initialize())
app.use(passport.session())
passport.use(new passportLocal(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.use((req,res,next)=>{
    if(!['/login', '/'].includes(req.originalUrl)) {
        req.session.returnTo = req.originalUrl;
    }
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})


//ROUTES
app.get('/', (req,res)=>{
    res.render('home')
})

//SHOW ALL DOGS
app.get('/dogs', catchAsync(async(req,res) => {
    const dogs = await Dog.find({})

    res.render('dogs/index', { dogs })
}))

//POST NEW DOG
app.get('/dogs/new', isLoggedIn, (req,res)=>{
    res.render('dogs/new')
})

app.post('/dogs', isLoggedIn, upload.array('dog[image]'), validateDog, catchAsync(async(req,res, next)=>{
    const dog = new Dog(req.body.dog)
    dog.author = req.user._id
    dog.images = req.files.map(f => ({url: f.path, filename: f.filename}))
    await dog.save()
    req.flash('success', 'Successfully published your puppy')
    res.redirect(`/dogs/${dog._id}`)
}))

//SHOW SINGLE DOG
app.get('/dogs/:id', catchAsync(async(req,res) => {
    const {id} = req.params
    const dog = await Dog.findById(id).populate('author')
    if(!dog){
        req.flash('error', 'Thankfuly the puppy already found a new home. Check out some others in need of love.')
        return res.redirect('/dogs')
    }
    res.render('dogs/details', { dog })
}))

//EDIT SINGLE DOG
app.get('/dogs/:id/edit', isLoggedIn, catchAsync(async(req,res) => {
    const {id} = req.params
    const dog = await Dog.findById(id)
    if(!dog){
        req.flash('error', 'Thankfuly the puppy already found a new home. Check out some others in need of love.')
        return res.redirect('/dogs')
    }
    res.render('dogs/edit', { dog })
}))

app.put('/dogs/:id', isLoggedIn, upload.array('dog[image]'), validateDog, catchAsync(async(req,res)=>{ 
    if(!req.body.dog) throw new ExpressError('Invalid try buddy', 400)
    const {id} = req.params
    const dog = await Dog.findById(id)
    if(!dog.author.equals(req.user._id)){
        req.flash('error', 'Nice try buddy')
        return res.redirect('/dogs')
    }
    const updatedDog = await Dog.findByIdAndUpdate(id, {...req.body.dog})
    const images = req.files.map(f => ({url: f.path, filename: f.filename}))
    dog.images.push(...images)
    await dog.save()
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages) await cloudinary.uploader.destroy(filename)
        await dog.updateOne({$pull: {images:{filename: {$in: req.body.deleteImages}}}})
    }
    req.flash('success', 'Successfully updated your puppys information')
    res.redirect(`/dogs/${updatedDog._id}`)
}))

//delete a doggie = succesfully adopted
app.delete('/dogs/:id', isLoggedIn, catchAsync(async(req,res)=>{
    const {id} = req.params
    const dog = await Dog.findById(id)
    if(!dog.author.equals(req.user._id)){
        req.flash('error', 'Nice try buddy')
        return res.redirect('/dogs')
    }
    await Dog.findByIdAndDelete(id)
    for(let img of dog.images) {
        await cloudinary.uploader.destroy(img.filename);
    }
    req.flash('success', 'Thank you for getting a puppy a new home!')
    res.redirect('/dogs') 
}))

//register and login
app.get('/register', (req,res)=>{
    res.render('passport/register')
})

app.post('/register', catchAsync(async(req,res)=>{
    try {
    const {email,username,password} = req.body 
    const user = new User({email, username})
    const registeredUser = await User.register(user, password)
    req.login(registeredUser, (err) => {
        if(err) return next(err)
        req.flash('success', 'Wellcome to Posvoji.si')
        res.redirect('/dogs') 
    })
       
} catch(e){
        req.flash('error', e.message)
        res.redirect('/register')
    }
}))

app.get('/login', (req,res)=>{
    res.render('passport/login')
})

app.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res)=>{
    req.flash('success', 'Welcome back!')
    const redirectUrl =  req.session.returnTo || '/'
    delete req.session.returnTo
    res.redirect(redirectUrl)
})

app.get('/logout', (req,res)=>{
    req.logout()
    req.flash('success', 'Goodbye')
    res.redirect('/dogs')
})

// if nothing is found
app.all('*', (req,res,next) =>{
    next(new ExpressError('Page not found', 404))
})

app.use((err,req,res,next) => {
    const { statusCode=500} = err
    if(!err.message) err.message = "something went wrong"
    res.status(statusCode).render('error/error', {err})
})

app.listen(3000, () => console.log('Listening on port: 3000'))