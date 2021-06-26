const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const userRouter = require('./routes/users');
const stickyRouter = require('./routes/sticky_board');
const session = require('express-session');
const app = express();

var port = '3005'
var hostname = 'localhost'

//set views engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//set static path
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret : 'stickyNotes123#',resave: false,saveUninitialized: true}));

// Add headers
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,enctype,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();  
});

app.use('/', userRouter);
app.use('/stickyBoard', stickyRouter);

app.listen(port, hostname, function(){
    console.log(`Server started on port http://${hostname}:${port}`);
});