const mongoose = require('mongoose')
const Dog = require('../models/dogs')

mongoose.connect('mongodb://localhost:27017/posvoji', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
db.once('open', ()=>{
    console.log('database conected');
})

const dogNames = ['Bella', 'Luna', 'Charlie', 'Lucy', 'Cooper', 'Max', 'Bailey', 'Daisy',]
const dogBreed = ['Labrador', 'Bulldog', 'German Sheeperd', 'Poodle', 'Beagle', 'Rottweiler', 'Pomerantz']

const seedDB = async() => {
    
    await Dog.deleteMany({})
    
    for(let i = 0; i < 20; i++) {
    
        const dog = new Dog({
        name: dogNames[Math.floor(Math.random() * dogNames.length - 1)],
        age: Math.floor(Math.random() * 10 + 1),
        breed: dogBreed[Math.floor(Math.random() * dogBreed.length - 1)],
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sed vehicula nisi. Curabitur aliquam arcu quis scelerisque dignissim. Praesent nunc tellus, tristique ac finibus sit amet, aliquet ac nulla. Morbi placerat eu dolor sed porta. Mauris accumsan libero sed leo fringilla vehicula. Pellentesque eu nisi et magna sagittis fermentum a sed neque. Aliquam ultricies viverra nunc sodales tincidunt. Nunc mattis cursus leo tempor tristique. Donec sagittis libero nunc, et pellentesque magna aliquam tempus. Aenean augue turpis, suscipit vel luctus volutpat, mattis in sapien. Etiam vehicula, urna et vestibulum facilisis, turpis eros condimentum elit, sed elementum lorem orci scelerisque lacus. Pellentesque accumsan ornare tellus sed tristique. Sed ornare erat elit, eget viverra magna gravida ac. Duis lobortis est ac metus condimentum, in varius diam dignissim'
    })

    await dog.save()
}}

seedDB()