const { default: mongoose } = require("mongoose");
const bcrypt = require ('bcrypt');


const userSchema =  mongoose.Schema(
  {
    name:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30,
        match: /^[a-zA-ZáéíóúüÁÉÍÓÚÜ\s]+$/, // Permite espacios y tildes
    },

    lastName:{
        type: String,
        minlength: 3,
        maxlength: 30,
        match: /^[a-zA-ZáéíóúüÁÉÍÓÚÜ]+$/
    },

    email:{
        type: String,
        lowercase: true,
        required: true,
        minlength: 7,
        maxlength: 50,
        unique: true,
        match: [/[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*@[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*[.][a-zA-Z]{2,5}/, 'ingresa un correo valido'],
        set: v => v.replace(/\s+/g, '') //quitar espacios
    },

     password:{
        type: String,
        required: true,
        minlength: 4,
        maxlength: 20,
    },

    profile: {
      type: String,
      enum: ["A", "B", "C"],
      default: "C",
    },

    incomeMonthly: {
      type: Number, 
      default: 0,
    },

    creditScore: {
      type: Number,
      default: null, 
    },

    role: {
      type: String,
      enum: ["customer", "admin", "owner"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, 
  }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});


const userModel = mongoose.model('users', userSchema)
module.exports = userModel

// {
//   "name": "Andres",
//   "lastName": "Cardenas",
//   "email": "andres@gmail.com",
//   "password": "clave",

//   "role": "admin", 
//      solo el owner puede crear users admin o customer si no es registro

// }
