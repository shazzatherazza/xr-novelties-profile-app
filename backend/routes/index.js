var express = require("express");
var router = express.Router();
var User = require("../models/user");
var mid = require("../middleware");
// GET /logout
// Log out if already logged in, then redirect to the login page
router.get("/logout", function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect("/login");
      }
    });
  }
});
// GET /profile
// View profile information if logged in, otherwise return error
router.get("/profile", mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId).exec(function(error, user) {
    if (error) {
      return next(error);
    } else {
      return res.json({
        title: "Profile",
        name: user.name,
        role: user.role
      });
    }
  });
});

// GET /login
// View the login page if logged out, otherwise redirect to the profile page
router.get("/login", mid.loggedOut, function(req, res, next) {
  return res.json({ title: "Log In" });
});
// POST /login
// Try to login, if successful redirect to the profile page, otherwise return errors
router.post("/login", function(req, res, next) {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function(error, user) {
      if (error || !user) {
        var err = new Error("Wrong email or password.");
        err.status = 401;
        return next(err);
      } else {
        req.session.userId = user._id;
        return res.redirect("/profile");
      }
    });
  } else {
    var err = new Error("Email and password are required.");
    err.status = 401;
    return next(err);
  }
});
// GET /register
// View the register page if logged out, otherwise redirect to the profile page
router.get("/register", mid.loggedOut, function(req, res, next) {
  return res.json({ title: "Sign Up" });
});
// POST /register
// Try to register, if successful redirect to the profile page, otherwise return errors
router.post("/register", function(req, res, next) {
  if (
    req.body.email &&
    req.body.name &&
    req.body.role &&
    req.body.password &&
    req.body.confirmPassword
  ) {
    // confirm that the user typed the same password twice
    if (req.body.password !== req.body.confirmPassword) {
      var err = new Error("Passwords do not match.");
      err.status = 400;
      return next(err);
    }
    // create object with form input
    var userData = {
      email: req.body.email,
      name: req.body.name,
      role: req.body.role,
      password: req.body.password
    };
    User.create(userData, function(error, user) {
      if (error) {
        return next(error);
      } else {
        req.session.userId = user._id;
        return res.redirect("/profile");
      }
    });
  } else {
    var err = new Error("All fields required.");
    err.status = 400;
    return next(err);
  }
});

module.exports = router;
