const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const e = require("express");
const riskProfile = require("./riskProfile.model");

const userSchema = mongoose.Schema(
  {
    //informacion de registro
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-ZáéíóúüÁÉÍÓÚÜ\s]+$/, // Permite espacios y tildes
    },

    lastName: {
      type: String,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-ZáéíóúüÁÉÍÓÚÜ]+$/,
    },

    documentType: {
      type: String,
      enum: ["cc", "ce", "passport", "other"],
    },

    documentNumber: {
      type: String,
      unique: true,
      minlength: 5,
      maxlength: 20,
      set: (v) => v.replace(/\s+/g, ""), // Quitar espacios
    },

    email: {
      type: String,
      lowercase: true,
      required: true,
      minlength: 7,
      maxlength: 50,
      unique: true,
      match: [
        /[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*@[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*[.][a-zA-Z]{2,5}/,
        "Ingresa un correo válido",
      ],
      set: (v) => v.replace(/\s+/g, ""), // Quitar espacios
    },

    password: {
      type: String,
      required: true,
      minlength: 4,
    },

    role: {
      type: String,
      enum: ["customer", "admin", "owner"],
      default: "customer",
    },

    //informacion personal
    gender: {
      type: String,
      enum: ["masculino", "femenino", "otro"],
    },

    age: {
      type: Number,
      min: 18,
      max: 100,
    },

    maritalStatus: {
      type: String,
      enum: ["soltero", "casado", "divorciado", "viudo"],
    },

    city: { 
      type: String,
    },

    academicLevel: {
      type: String,
      enum: ["primaria", "secundaria", "tecnico", "pregrado", "postgrado"],
    },

    employmentType: {
      type: String,
      enum: ["empleado", "independiente", "desempleado", "jubilado"],
    },

    ocupacion: { 
        type: String,
        enum: ["Comerciante",
        "Rentista","profesional independiente","transportador"], 
    },

    contractType: {
      type: String,
      enum: ["indefinido", "fijo", "otro"],
    },

    employmentYears: { 
        type: Number 
    },

    profession: { 
        type: String 
    }, 

    nit: { 
        type: String 
    }, 

    hasRUT: { 
        type: Boolean 
    },



    // informacion financiera
    housingType:{
        type: String,
        enum: ["propia", "familiar", "arrendada", "otra"],
    },

    ownerProperty:{
        type: String,
        enum: ["si", "no"],
    },

    incomeMonthly: {
      type: Number,
    },
    otherIncomeMonthly: {
      type: Number,
    },
    expensesMonthly: {
      type: Number,
    },
    valueOfAssets: {
      type: Number,
    },


    creditScore: {
      type: Number,
      default: 0,
    },
    profile: {
      type: String,
      enum: ["A", "B", "C"],
      default: "C",
    },
    riskProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "riskProfile",
      description:
        "Referencia al perfil de riesgo que aplicó a esta simulación",
    },
    
     totalDebt: {
      type: Number,
    }, 
    activeLoans: {
      type: Number,
    }, 
    paymentHistory: [
      {
        onTime: { type: Boolean },
        amount: { type: Number },
        date: { type: Date },
      },
    ],

    
    // estado del usuario
    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    inactiveAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Hashear password automáticamente
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;

// {
//   "name": "Carlos",
//   "lastName": "Cardenas",
//   "email": "carlos@gmail.com",
//   "password": "clave",
//   "role": "admin", solo owner
//   "employmentType": "empleado", solo clientes
//   "incomeMonthly": "2000000",solo clientes
// }
