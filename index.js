const express = require('express');
const connectionDB = require('./config/db');
const cookieParser = require('cookie-parser');
const router = require('./routes/route');
const cors = require('cors'); 
require('dotenv').config();

const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:4200', // tu front-end Angular
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // si vas a usar cookies o auth
}));


// Middlewares
app.use(express.json());
app.use(cookieParser());

// Rutas
app.use('/api', router);

app.use('/api/health', (req, res) => {
  res.status(200).json({ msj: 'API "simulator" is healthy' });
});

// Conexión a DB
connectionDB();

// Servidor
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
