var express = require('express');
app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/main');
var User = require('./app/models/user');
var jwt = require('jsonwebtoken');
var port = 3000;

// Use body-parser to get POST requests for API Use
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Log requests to console
app.use(morgan('dev'));

// Initialize passport for use
app.use(passport.initialize());

mongoose.Promise = global.Promise; //for newer version of mongoose
// Connect to db
mongoose.connect(config.database);

// Bring in passport strategy we just defined
require('./config/passport')(passport);

// Create API group routes
var apiRoutes = express.Router();

// Register new users
apiRoutes.post('/register', function(req, res) {
    if (!req.body.email || !req.body.password) {
        res.json({ success: false, message: 'Please enter email and password'});
    } else {
        var newUser = new User({
            email: req.body.email,
            password: req.body.password
        });
        // save new user
        newUser.save(function(err) {
            if (err) {
                return res.json({ success: false, message: 'Email address already exist.'});
            }
            res.json({ success: true, message: 'Sucessfully created new user.'});
        });
    }
});

// Authenticate the user and get a JWT
apiRoutes.post('/authenticate', function(req, res) {
    User.findOne({
        email: req.body.email
    }, function(err, user) {
        if (err) throw err;
        if (!user) {
            res.send({ success: false, message: 'Authentication failed, user not found'});
        } else {
            // check if password matches
            user.comparePassword(req.body.password, function(err, isMatch) {
                if (isMatch && !err) {
                    // create token
                    var token = jwt.sign(user, config.secret, {
                        expiresIn: 10080 // in seconds
                    });
                    res.json({ success: true, token: 'JWT ' + token }); 
                } else {
                    res.send({ success: false, message: 'Authentication failed. Password not match'});
                }
            });
        }
    });
});
// Protect dashboard route with JWT
apiRoutes.get('/dashboard', passport.authenticate('jwt', { sessions: false}), function(req, res) {
    res.send('It worked! User id is: ' + req.user._id + '.');
});
// Set url for APi Group routes
app.use('/api', apiRoutes);

// Home route
app.get('/', function(req, res) {
    res.send('will put home page here laterssss');
});

app.listen(port);
console.log('Your server is running on port ' + port + '.');
