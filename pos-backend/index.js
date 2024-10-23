require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Import CORS
const signup = require('./api/signup');
const sendEmail = require('./api/mail'); // Import the sendEmail function
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

app.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body;
  
  sendEmail(to, subject, text)
    .then((info) => {
      console.log('Email sent successfully:', info.response);
      res.status(200).json({ message: 'Email sent successfully', info });
    })
    .catch((error) => {
      console.log('Error sending email:', error);
      res.status(500).json({ message: 'Error sending email', error });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
