/* JOI VALIDATION */
const Joi = require('joi')
const ExpressError = require('./ExpressError')


module.exports =  validateDog = (req,res,next) =>{
    const dogSchema = Joi.object({
    dog: Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required().min(0).max(20),
        breed: Joi.string().required(),
        description: Joi.string().required(),
    }).required(),
    deleteImages: Joi.array()
})
    const { error } = dogSchema.validate(req.body)
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else{
        next()
    }
}
