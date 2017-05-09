// Load environment variables, where API keys and passwords are configured.
require('dotenv').load({ path: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env.prod' });

const path = require('path');
const http = require('http');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const debug = require('debug')('server');
const nunjucks = require('nunjucks');
const connectFlash = require('connect-flash');
const mongoose = require('mongoose');
const chalk = require('chalk');
const passport = require('passport');
const expressValidator = require('express-validator');
const csrf = require('csurf');

const passportConfig = require('./config/passport');

const homeController = require('./controllers/home');
const userController = require('./controllers/user');


// ======================================
// start express app
//
const app = express();
app.use(helmet()); // security middlewares


// ======================================
// view engine setup
//
nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
});
app.set('view engine', 'njk');


// ======================================
// general setup
//
const loggerOption = (app.get('env') === 'development') ? 'dev' : 'tiny';
app.use(logger(loggerOption));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(expressValidator());


// ======================================
// MongoDB setup
//
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log(`${chalk.red('✗')} MongoDB connection error. Please make sure MongoDB is running.`);
  process.exit();
});
mongoose.connection.once('open', () => {
  debug('mongodb connection established');
});

// ======================================
// session setup
//
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true,
    clear_interval: 3600,
  }),
}));

// ======================================
// csrf protection
//
app.use(csrf(), (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// ======================================
// flash messages setup
//
app.use((req, res, next) => {
  connectFlash()(req, res, function() {
    // res.locals.messages = req.flash();
    const render = res.render;
    res.render = function (...args) {
      // attach flash messages to res.locals.messages
      res.locals.messages = req.flash();
      render.call(res, ...args);
    };
    next();
  });
});

// ======================================
// Setup passportjs
//
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


// ======================================
// Primary app routes.
//
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/logout', userController.logout);
app.get('/account', passportConfig.ensureLoggedIn(), userController.getAccount);
app.post('/account/password', passportConfig.ensureLoggedIn(), userController.postUpdatePassword);
app.post('/account/profile', passportConfig.ensureLoggedIn(), userController.postUpdateProfile);
app.post('/account/delete', passportConfig.ensureLoggedIn(), userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.ensureLoggedIn(), userController.getOauthUnlink);


// ======================================
// OAuth authentication routes. (Sign in)
//
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  const redirectTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
});

app.get('/test', passportConfig.ensureLoggedIn(), passportConfig.isAuthorized('facebook'),
  (req, res, next) => {
    res.status(200).json({ success: true });
  });

// ======================================
// catch 404 and forward to error handler
//
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// ======================================
// error handlers
//
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// ======================================
// create server

const port = normalizePort(process.env.PORT || '5000');
app.set('port', port);
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// ======================================
// functions

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  const portNormalized = parseInt(val, 10);

  if (isNaN(portNormalized)) {
    // named pipe
    return val;
  }

  if (portNormalized >= 0) {
    // port number
    return portNormalized;
  }

  return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event.
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

