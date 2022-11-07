const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
let path = require('path');
const fs = require('fs');
const mailgun = require("mailgun-js");
const DOMAIN = "ecfcrypto.com";
const { api_key } = require("../../config/keys");
const mg = mailgun({ apiKey: api_key, domain: DOMAIN, host: "api.eu.mailgun.net", });
// Load User model
const User = require("../../models/user");
const Wallet = require("../../models/wallet")
// @route POST api/users/register
// @desc Register user
// @access Public
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folderName = 'public';
        try {
            if (!fs.existsSync(folderName)) {
              fs.mkdirSync(folderName);
            }
          } catch (err) {
            console.error(err);
          }
        cb(null, 'public');
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

const idUpload = upload.fields([{name:'idFrontImage', maxCount:1}, {name:'idBackImage', maxCount:1}, {name:'realPhoto', maxCount:1}])


router.post("/checkusername", (req, res) => {
    const name = req.body.userName;
    User.findOne({name:name})
    .then(user => {
        if(user){
            return res.status(401).json({name:"username is already exists"});
        } else {
            return res.status(200).json("unique username");
        }
    })
    .catch(() => {
        return res.status(402).json("database connect error");
    })
})

router.post("/register", idUpload, (req, res) => {
    console.log(req.body, "req register");
    User.findOne({ name: req.body.userName }).then(user => {
        if (user) {
            return res.status(400).json({ name: "userName already exists" });
        } else {
            const newUser = new User({
                name: req.body.userName,
                password: req.body.password,
                recoveryPhrase: JSON.parse(req.body.recoveryPhrase),
                full_name: req.body.fullName,
                email: req.body.email,
                phoneNumber: "",
                address: req.body.address,
                birthday: req.body.birthday,
                nationality: req.body.nationality,
                city: req.body.city,
                country: req.body.country,
                region: req.body.region,
                zip_code: req.body.zipCode,
                id_front_image: req.files.idFrontImage[0].filename,
                id_back_image: req.files.idBackImage[0].filename,
                real_photo: req.files.realPhoto[0].filename,
                permission:"0"
            });
            const data = {
                from: "no-reply@ecfcrypto.com",
                to: "helpdesk@ecfcrypto.com",
                subject: "ECF CRYPTO New User",
                html:`
                <div style="color:#757575 !important">
                    <h1 style="text-align:center">ECF Crypto</h1>
                    <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                    font-size: 16px;
                    color: #757575;
                    line-height: 150%;
                    letter-spacing: normal;">Hello Admin.</p>
                    <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                    font-size: 16px;
                    color: #757575;
                    line-height: 150%;
                    letter-spacing: normal;">New user ${newUser.name} came and Signed Up.</p>
                    <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                    font-size: 16px;
                    color: #757575;
                    line-height: 150%;
                    letter-spacing: normal;">Please check new user's ID.</p>
                    <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                    font-size: 16px;
                    color: #757575;
                    line-height: 150%;
                    <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                    font-size: 16px;
                    color: #757575;
                    line-height: 150%;
                    letter-spacing: normal;">Best regards,</p>
                    <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                    font-size: 16px;
                    color: #757575;
                    line-height: 150%;
                    letter-spacing: normal;">ECF Crypto team</p>
                    </div>
                `
              };
              mg.messages().send(data, function (error, body) {
                console.log(body, "body register new");
                console.log(error, "error register new");
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
    })
    .catch(() => {
        res.status(401).json("database connect error");
    });
});
// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
    const name = req.body.userName;
    const password = req.body.password;

    if(name === "Admin" && password === "gA_8qr3aV)%7(;Q"){
        return res
            .status(201)
            .json({ admin: "admin" });
    }
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
                if(user.permission === "0"){
                    return res
                    .status(401)
                    .json({ checking: "checking" });
                } else if (user.permission === "2"){
                    return res
                    .status(402)
                    .json({ disabled: "disabled" });
                } else {
                    const payload = {
                        id: user.id,
                        name: user.name,
                        fullName: user.full_name,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        image: user.image,
                        date: user.date,
                        country:user.country,
                        city:user.city
                    };
                    // Sign token
                    jwt.sign(
                        payload,
                        keys.secretOrKey,
                        {
                            expiresIn: 31556926 // 1 year in seconds
                        },
                        (err, token) => {
                            res.status(200).json({
                                success: true,
                                token: "Bearer " + token
                            });
                        }
                    );  
                }
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
        user.full_name = req.body.fullName;
        user.city = req.body.city;
        user.country = req.body.country;
        user.email = req.body.email;
        user.phoneNumber = req.body.phoneNumber;
        user.save().then(() => {
            const payload = {
                id: user.id,
                name: user.name,
                fullName: user.full_name,
                city: user.city,
                country: user.country,
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
                fullName: user.full_name,
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

// adminpanel

const temp = async (item, count) => {
    var btcAddress = "";
    var ethAddress = "";

    const wallet = await Wallet.findOne({name:item.name});
    if(!!wallet){
        btcAddress = wallet.bitcoinAddress;
        ethAddress = wallet.ERC20Address;
    }
    return {
        name:item.name,
        full_name:item.full_name,
        email:item.email,
        phoneNumber:item.phoneNumber,
        address:item.address,
        nationality:item.nationality,
        city:item.city,
        country:item.country,
        region:item.region,
        zip_code:item.zip_code,
        id_front_image:item.id_front_image,
        id_back_image:item.id_back_image,
        real_photo:item.real_photo,
        image:item.image,
        birthday:item.birthday,
        btcAddress:btcAddress, 
        ethAddress:ethAddress,
        permission:item.permission,
        count:count
    }
}

router.post("/getalluser", (req, res) => {
    const limit = req.body.limit;
    const skip = (req.body.page - 1) * limit;
    const searchValue = req.body.searchValue;
    var count = 0;
    var permission = req.body.permission;
    if(permission === "3"){
        permission = "";
    }
    User.find({"name" : {$regex : searchValue}, permission:{$regex : permission}})
    .then((users) => {
        if(!!users){
            count = users.length;
        }
    })
    // Find user by email
    User.find({$or:[
        {"name" : {$regex : searchValue}, permission:{$regex : permission}},
        {"email" : {$regex : searchValue}, permission:{$regex : permission}}
    ]})
    .limit(limit)
    .skip(skip)
    .then(async(users) => {
        // Check if user exists
        if (!users) {
            return res.status(404).json({ usernotfound: "user not found" });
        }
        else{
            console.log(users, "users");
            let result = [];
            for (let i = 0; i < users.length; i++) {
                let item = await temp(users[i], count);
                result.push(item);
            }
            console.log(result, "result");
            return res.status(200).json(result);
        }
    })
});

router.post("/permission", (req, res) => {
    const name = req.body.userName;
    let permission = req.body.permission;
    User.findOne({ name: name }).then(user => {
        user.permission = permission;
        user.save().then(() => {
            if(permission === "1"){
                const data = {
                    from: "no-reply@ecfcrypto.com",
                    to: user.email,
                    subject: "ECF CRYPTO Active ID",
                    "h:Reply-To":"helpdesk@ecfcrypto.com",
                    html:`
                    <div style="color:#757575 !important">
                            <h1 style="text-align:center">ECF Crypto</h1>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Hello ${name}</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Thank you for signing up to ECF Crypto! We're excited to have you onboard and will be happy to help you set everything up.</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">We checked your Id and Now you can Sign In our site.</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Please let us know if you have any questions, feature requests, or general feedback simply by replying to this email.</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Best regards,</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">ECF Crypto team</p>
                            </div>
                    `
                };
                mg.messages().send(data, function (error, body) {
                    console.log(body, "body");
                    console.log(error, "error");
                });       
            } else if( permission === "2") {
                const data = {
                    from: "no-reply@ecfcrypto.com",
                    to: user.email,
                    subject: "ECF CRYPTO Active ID",
                    "h:Reply-To":"helpdesk@ecfcrypto.com",
                    html:`
                    <div style="color:#757575 !important">
                            <h1 style="text-align:center">ECF Crypto</h1>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Hello ${name}</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Sorry but your account is disabled.</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Please let us know if you have any questions, feature requests, or general feedback simply by replying to this email.</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">Best regards,</p>
                            <p style="font-family: 'Open Sans','Roboto','Helvetica Neue',Helvetica,Arial,sans-serif;
                            font-size: 16px;
                            color: #757575;
                            line-height: 150%;
                            letter-spacing: normal;">ECF Crypto team</p>
                            </div>
                    `
                  };
                  mg.messages().send(data, function (error, body) {
                    console.log(body, "body");
                    console.log(error, "error");
                  });
            }
            res.status(200).json({ state: "success" });
        }).catch((err) => { handleErr(err) })
    })
})

router.post("/adminUpdate", (req, res) => {
    const name = req.body.userName;
    let phoneNumber = req.body.phoneNumber;
    let password = req.body.password;
    let email = req.body.email;
    User.findOne({ name: name }).then(user => {
        if(!!phoneNumber){
            user.phoneNumber = phoneNumber;
        }
        if(!!email){
            user.email = email;
        }
        if(!!password){
            console.log(password, "password here");
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) throw err;
                    user.password = hash;
                    user.save().then(() => {
                        res.status(200).json({ state: "success" });
                    }).catch((err) => { handleErr(err) })
                    console.log(user.password, "password push 1");
                });
            });
        } else {
            console.log(user.password, "password push 2");
            user.save().then(() => {
                res.status(200).json({ state: "success" });
            }).catch((err) => { handleErr(err) })
        }
    })
})

router.post("/delete", (req, res) => {
    const name = req.body.userName;
    Wallet.findOne({name:name})
    .then(wallet => {
        if(!!wallet){
            Wallet.findOneAndDelete({ name: name })
            .catch((err) => { handleErr(err) })
        }
        console.log("wallet");
    })
    User.findOneAndDelete({ name: name })
    .then(() => {
            res.status(200).json({ state: "success" });
    })
    .catch((err) => { handleErr(err) })
})

module.exports = router;
