const express = require('express');
const Joi = require('joi');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const router = express.Router();
const secretKey = 'yourSecretKey';

const signupSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  name: Joi.string().min(2).required(),
  dob: Joi.date().iso().required(),
  phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  businessName: Joi.string().min(2).required(),
  emailId: Joi.string().email().required(), 
});

const sendConfirmationEmail = async (emailId, token) => {
  try {
    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // Using Gmail as an example
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
      }
    });

    // Define email options
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: emailId,  // User's email
      subject: 'Confirm your email address',
      text: `Thank you for signing up! Please confirm your email by clicking on the link: 
      http://your-frontend-url/confirm-email?token=${token}`,  // Email text with the confirmation link
      html: `<p>Thank you for signing up! Please confirm your email by clicking on the link below:</p>
      <a href="http://your-frontend-url/confirm-email?token=${token}">Confirm Email</a>`  // HTML email body
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

router.post('/', async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, name, dob, phoneNumber, businessName, emailId } = req.body;
    const existingUser = await User.findOne({
      $or: [{ username }, { emailId }, { phoneNumber }]
    });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.emailId === emailId) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
    }

    const newUser = new User({
      username,
      name,
      dob,
      phoneNumber,
      businessName,
      emailId,
    });

    await newUser.save();
    
    // Send response first
    res.status(201).json({ message: 'User registered successfully!' });

    // Send email asynchronously after the response
    const token = jwt.sign({ emailId }, secretKey, { expiresIn: '1h' });
    await sendConfirmationEmail(emailId, token);

  } catch (err) {
    console.error('Error:', err.message);
    // Send error response
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});


router.patch('/set-password', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

module.exports = router;
