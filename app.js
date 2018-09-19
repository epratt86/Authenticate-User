const dotenv = require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const exphbs = require('express-handlebars');
const expressSanitizer = require('express-sanitizer');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const http = require('http');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const path = require('path');
const app = express();
const sessionStore = new session.MemoryStore;
const { User } = require('./server/models/user');
const { Form } = require('./server/models/form');
const { mongoose } = require('./server/db/mongoose');
const port = process.env.PORT || 8000;



app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_PARSER));
//expressSanitizer
app.use(expressSanitizer());
//express session middleware
app.use(session({
  secret: process.env.SESSION,
  resave: true,
  store: sessionStore,
  saveUninitialized: true,
  cookie: {maxAge: 60000 }
}));

//passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

//lets us know who is logged in. keep above routes
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.get('/', (req, res) => {
  res.render('landing', {title: 'Sartorius | Sign In', layout: 'no-header'});
});

//create new account
app.get('/register', (req, res) => {
  res.render('register', {title: 'Sartorius | Create Account'});
});

app.post('/register', (req, res) => {
  User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
    if (err) {
        return res.render('register', { user : user });
    }

    passport.authenticate('local')(req, res, function () {
      res.redirect('/');
    });
  });
});

//Log in
app.post('/login', passport.authenticate('local', {
  successRedirect: '/index',
  failureRedirect: '/register'
}));

//index route
app.get('/index', (req, res) => {
  res.render('index', {title: 'Sartorius | Home'});
});


app.listen(port, () => {
  console.log(`Server is running on: ${port}`);
});
