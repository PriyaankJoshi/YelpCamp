var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose', { useNewUrlParser: true });
var passport = require('passport');
var LocalStrategy = require('passport-local');
var Campground = require('./models/campgrounds');
var Comment = require('./models/comments');
var User = require('./models/user');
var seedDB = require('./seeds');

mongoose.connect('mongodb+srv://test:test@cluster0-6ahfi.mongodb.net/test?retryWrites=true&w=majority');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

//seedDB();

//PASSPORT CONFIGURATION
app.use(require('express-session')({
    secret: "Encoded script",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

// var arr = [
//     {name: 'Image 1', image: 'https://picsum.photos/id/237/200/300'},
//     {name: 'Image 2', image: 'https://picsum.photos/200/300?grayscale'},
//     {name: 'Image 3', image: 'https://picsum.photos/id/870/200/300?grayscale&blur=2'},
//     {name: 'Image 1', image: 'https://picsum.photos/id/237/200/300'},
//     {name: 'Image 3', image: 'https://picsum.photos/id/870/200/300?grayscale&blur=2'},
//     {name: 'Image 1', image: 'https://picsum.photos/id/237/200/300'},
//     {name: 'Image 3', image: 'https://picsum.photos/id/870/200/300?grayscale&blur=2'},
//     {name: 'Image 1', image: 'https://picsum.photos/id/237/200/300'},
//     {name: 'Image 3', image: 'https://picsum.photos/id/870/200/300?grayscale&blur=2'}
// ];

app.get('/', function(req, res){
    res.render('campgrounds/landing');
})

app.get('/campgrounds', function(req, res){
    Campground.find({}, function(err, allCampGrounds){
        if(err){
            console.log(err);
        } else{
            res.render('campgrounds/campgrounds', {arr: allCampGrounds, currentUser: req.user});
        }
    });
});

app.post('/campgrounds', function(req, res){
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var campgrounds = {name: name, image: image, description: description};
    Campground.create(campgrounds, function(err, campgrounds){
        if(err){
            console.log(err);
        } else {
            res.redirect('/campgrounds');
        }
    });
});

app.get('/campgrounds/new', function(req, res){
    res.render('campgrounds/new');
});

app.get('/campgrounds/:id', function(req, res){
    Campground.findById(req.params.id).populate('comments').exec(function(err, foundCampground){
        if(err){
            console.log(err);
        }
        else{
            res.render('campgrounds/show', {campground: foundCampground});
        }
    });
});

app.get('/campgrounds/:id/comments/new', isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            res.render('comments/new', {campground: campground});
        }
    });
});

app.post('/campgrounds/:id/comments', isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                } else {
                     campground.comments.push(comment);
                     campground.save();
                     res.redirect('/campgrounds/' + campground._id);
                }
            });
        }
    });
});

//AUTHENTICATION ROUTES
app.get('/register', function(req, res){
    res.render('register');
});

app.post('/register', function(req, res){
    var newUser = req.body.username;
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate('local')(req, res, function(){
            res.redirect('/campgrounds');
        });
    });
});

app.get('/login', function(req, res){
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
        successRedirect: '/campgrounds',
        failureRedirect: '/login'
    }), function(req, res){
        
    }
);

app.get('/logout', function(req, res){
    req.logOut();
    res.redirect('/campgrounds');
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

app.listen(3000, function(){
    console.log('The app has started');
});