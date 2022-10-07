const express = require("express");
const router = express.Router();
// Load User model
const Watchlist = require("../../models/watchlist");
// @route POST api/users/register
// @desc Register user
// @access Public

router.post("/savetokenlist", (req, res) => {
    console.log(req.body, "req tokenlist");
    Watchlist.findOne({ name: req.body.userName }).then(user => {
        if (user) {
            user.tokenlist = [...user.tokenlist, ...req.body.tokenlist];
            user.save()
                .then(user => res.status(200).json(user))
                .catch(err => console.log(err));
        } else {
            const newUser = new Watchlist({
                name: req.body.userName,
                tokenlist: req.body.tokenlist,
            });
            newUser
                .save()
                .then(user => res.json(user))
                .catch(err => console.log(err));
        }
    });
});
router.get("/gettokenlist/:name", (req, res) => {
    let name = req.params.name;
    Watchlist.findOne({ name: name })
        .then(user => {
            if (user) {
                return res.status(200).json({ tokenList: user.tokenlist });
            }
            else {
                return res.status(400).json("user not found.");
            }
        })
})
module.exports = router;
