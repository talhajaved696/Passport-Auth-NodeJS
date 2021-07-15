const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const session = require('express-session');
const app = express();
dotenv.config({
    path: './config/config.env',
});
// Passport Config
require('./config/passport')(passport);

// DB Config
const db = process.env.MONGOURI;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));


// Express body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
// Assessts
app.use(express.static('public'));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
