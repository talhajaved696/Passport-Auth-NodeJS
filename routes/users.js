const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
// Load User model
const User = require('../models/User');
var imgModel = require('../models/Image');
const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

//Profile
router.get('/profile', (req, res) => {
  imgModel.find({}, (err, items) => {
    if (err) {
      console.log(err);
      res.status(500).send('An error occurred', err);
    }
    else {
      res.render('profile', { items: items, user: req.user });
    }
  });
});



// Image Update API 
router.post('/profile',upload.single('image'),async (req, res, next) => {
 try {
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
     // Create new user
    let image = new imgModel({
      user: req.user._id,
      img: result.secure_url,
      cloudinary_id: result.public_id,
    });
    // Save user
    await image.save();
    res.json(image);
  } catch (err) {
    console.log(err);
  }});

router.put("/profile/:id", upload.single("image"), async (req, res) => {
  try {
    let image = await imgModel.findById(req.params.id);
    // Delete image from cloudinary
    await cloudinary.uploader.destroy(image.cloudinary_id);
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    const data = {
      user: req.user._id,
      avatar: result.secure_url || image.img,
      cloudinary_id: result.public_id || image.cloudinary_id,
    };
    user = await User.findByIdAndUpdate(req.params.id, data, {
 new: true
 });
    res.json(image);
  } catch (err) {
    console.log(err);
  }});

// API Testing
router.get('/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.img
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

router.put('/user/:id',async (req, res) => {
  const {
    img
  } = req.body

  const user = await User.findById(req.params.id)

  if (user) {
    user.img = img

    const updatedUser = await user.save()
    res.json(updatedUser)
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})
module.exports = router;