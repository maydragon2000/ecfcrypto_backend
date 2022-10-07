const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const users = require("./routes/api/users");
const cryptoCurrency = require("./routes/api/cryptoCurrency");
const watchlist = require("./routes/api/watchlist");
const wallet = require("./routes/api/wallet");
const cors = require("cors");
const path = require("path");
// const whitelist = ['http://localhost:3000'];
const corsOptions = {
    credentials: true, // This is important.
    origin: (origin, callback) => {
        //Myong sample
        return callback(null, true)
        // if (whitelist.includes(origin))
        //     return callback(null, true)

        callback(new Error('Not allowed by CORS'));
    }
}
const app = express();
// Bodyparser middleware
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'public')));

// DB Config
const db = require("./config/keys").mongoURI;
// Connect to MongoDB
mongoose
    .connect(
        db,
        { useNewUrlParser: true }
    )
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err));
// Passport middleware
app.use(passport.initialize());
// Passport config
require("./config/passport")(passport);
// Routes
app.use("/api/users", users);
app.use("/api/cryptocurrency", cryptoCurrency);
app.use("/api/watchlist", watchlist);
app.use("/api/wallet", wallet);
// app.use("*", (req, res) => {
//     res.sendFile(path.join(__dirname, 'public'))
// })

const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there
app.listen(port, "0.0.0.0", () => console.log(`Server up and running on port ${port} !`));