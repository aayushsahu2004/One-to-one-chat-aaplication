var express = require('express');
var router = express.Router();
const userModel = require("./users");
const localstrategy = require('passport-local');
const passport = require('passport');
const upload = require('./multer');

passport.use(new localstrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { messages: req.flash('error') });
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne(req.user)
  res.render('profile', { user });
});


router.get('/login', function (req, res, next) {
  res.render('login', { error: req.flash("error") })
});


router.post("/register", function (req, res, next) {

  const userData = new userModel({
    username: req.body.username,
    contact: req.body.contact
  });
  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile")
      })
    })
    .catch(function (err) {
      if (err.name === 'UserExistsError' || err.code === 11000) {
        req.flash('error', 'Username already exists');
        return res.redirect('/');
      } else if (err.name === 'MongoServerError' && err.message.includes("E11000 duplicate key")) {
        req.flash('error', "User with this email address already exist");
        return res.redirect('/');
      } else {
        req.flash('error', err.message);
        return res.redirect('/');
      }
    });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true,
}), function (req, res, next) { });

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/login")
}

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

router.post('/upload', isLoggedIn, upload.single('image'), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  console.log(user);
  user.img = req.file.filename;
  await user.save();
  res.redirect('/profile')
});

router.post('/update', isLoggedIn, async function (req, res, next) {
  const UpdateUser = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, about: req.body.about },
    { new: true }
  );

  req.login(UpdateUser, function (err) {
    if (err) {
      console.log(err);
    }
  })

  await UpdateUser.save();
  res.redirect('/profile')
})


module.exports = router;
