const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
let path = require('path');
// Load User model
const User = require("../../models/user");
// @route POST api/users/register
// @desc Register user
// @access Public
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '-' + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

let upload = multer({ storage, fileFilter });


router.post("/register", (req, res) => {
    User.findOne({ name: req.body.userName }).then(user => {
        if (user) {
            return res.status(400).json({ name: "userName already exists" });
        } else {
            const newUser = new User({
                name: req.body.userName,
                password: req.body.password,
                recoveryPhrase: req.body.recoveryPhrase,
                firstName: "",
                lastName: "",
                displayName: "",
                email: "",
                phoneNumber: ""
            });
            // Hash password before saving in database
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err));
                });
            });
        }
    });
});
// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
    const name = req.body.userName;
    const password = req.body.password;
    // Find user by email
    User.findOne({ name: name }).then(user => {
        // Check if user exists
        if (!user) {
            return res.status(404).json({ usernotfound: "user not found" });
        }
        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                // User matched
                // Create JWT Payload
                const payload = {
                    id: user.id,
                    name: user.name,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    displayName: user.displayName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    image: user.image,
                    date: user.date,
                };
                // Sign token
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                        expiresIn: 31556926 // 1 year in seconds
                    },
                    (err, token) => {
                        res.json({
                            success: true,
                            token: "Bearer " + token
                        });
                    }
                );
            } else {
                return res
                    .status(400)
                    .json({ passwordincorrect: "Password incorrect" });
            }
        });
    });
});
router.post("/recoveryphrase", (req, res) => {
    const name = req.body.userName;
    const recoveryPhrase = req.body.phraseWord;
    User.findOne({ name: name }).then(user => {
        if (!user) {
            return res.status(404).json({ usernotfound: "user not found" });
        }
        else {
            console.log(recoveryPhrase, "recoveryPhrase");
            console.log(user.recoveryPhrase, "user.recoveryphrase")
            if (recoveryPhrase.length == user.recoveryPhrase.length
                && recoveryPhrase.every(function (u, i) {
                    return u === user.recoveryPhrase[i];
                })) {

                return res.status(200).json({ name: user.name });
            } else {
                return res.status(400).json({ recoveryPhraseIncorrect: "recoveryPhrase incorrect" });
            }
        }
    })
})
router.post("/resetPassword", (req, res) => {
    const name = req.body.userName;
    let password = req.body.password;
    User.findOne({ name: name }).then(user => {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;
                password = hash;
                user.password = password;
                user.save().then(() => {
                    res.status(200).json({ state: "success" });
                }).catch((err) => { handleErr(err) })
            });
        });
    })
})
router.post("/resetuser", (req, res) => {
    const name = req.body.userName;
    User.findOne({ name: name }).then(user => {
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.displayName = req.body.displayName;
        user.email = req.body.email;
        user.phoneNumber = req.body.phoneNumber;
        user.save().then(() => {
            const payload = {
                id: user.id,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                image: user.image,
                date: user.date,
            };
            // Sign token
            jwt.sign(
                payload,
                keys.secretOrKey,
                {
                    expiresIn: 31556926 // 1 year in seconds
                },
                (err, token) => {
                    res.json({
                        success: true,
                        token: "Bearer " + token
                    });
                }
            );
        }).catch((err) => { handleErr(err) })
    })
})
router.post("/changePassword", (req, res) => {
    const name = req.body.userName;
    const oldPassword = req.body.oldPassword;
    let password = req.body.newPassword;
    User.findOne({ name: name }).then(user => {
        bcrypt.compare(oldPassword, user.password).then(isMatch => {
            if (isMatch) {
                // User matched
                // Create JWT Payload
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        password = hash;
                        user.password = password;
                        user.save().then(() => {
                            res.status(200).json({ state: "success" });
                        }).catch((err) => { handleErr(err) })
                    });
                });
            } else {
                return res
                    .status(400)
                    .json({ passwordincorrect: "Current Password incorrect" });
            }
        });


    })
})

router.post('/addImage', upload.single('photo'), (req, res) => {
    console.log(req, "req");
    const name = req.body.userName;
    const photo = req.file.filename;
    console.log(photo, "photo");
    User.findOne({ name: name }).then(user => {
        user.image = photo;
        user.save().then(() => {
            const payload = {
                id: user.id,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                image: user.image,
                date: user.date,
            };
            jwt.sign(
                payload,
                keys.secretOrKey,
                {
                    expiresIn: 31556926 // 1 year in seconds
                },
                (err, token) => {
                    res.json({
                        success: true,
                        token: "Bearer " + token
                    });
                }
            );
        }).catch((err) => { handleErr(err) })
    })
});
module.exports = router;
