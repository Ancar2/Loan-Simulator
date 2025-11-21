const express = require('express');
const connectionDB = require('./config/db');
const cookieParser = require('cookie-parser');
const router = require('./routes/route');
const cors = require('cors')


require('dotenv').config();


const app = express();
app.use(cors())
app.use(express.json()); 
app.use(cookieParser());
app.use('/api',router)
app.use('/api/health', (req, res) => {
  res.status(200).json({msj: 'API "simulator" is healthy'});
});

connectionDB();

app.listen (process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

