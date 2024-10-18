require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Import CORS
const signup = require('./api/signup');
const app = express();

app.use(express.json());
app.use(cors()); 

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3500; 

console.log('Mongo URI:', mongoURI);
console.log('Port:', port);

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/signup', signup); 


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
