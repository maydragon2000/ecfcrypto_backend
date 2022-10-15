// var fs = require('fs');
var http = require("http");
// var https = require('https');
// var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
// var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

// const privateKey  = fs.readFileSync('sslcert/privatekey.pem');
// const certificate = fs.readFileSync('sslcert/certificate.pem');

// console.log("___ private ___", certificate);
// var credentials = {key: privateKey, cert: certificate};
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const users = require("./routes/api/users");
const cryptoCurrency = require("./routes/api/cryptoCurrency");
const wallet = require("./routes/api/wallet");
const email = require("./routes/api/email");
const cors = require("cors");
const path = require("path");
// const whitelist = ['http://localhost:3000'];
const corsOptions = {
  credentials: true, // This is important.
  origin: (origin, callback) => {
    //Myong sample
    return callback(null, true);
    // if (whitelist.includes(origin))
    //     return callback(null, true)

    callback(new Error("Not allowed by CORS"));
  },
};
const app = express();

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "public")));

// DB Config
const db = require("./config/keys").mongoURI;
// Connect to MongoDB
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("MongoDB successfully connected"))
  .catch((err) => console.log(err));
// Passport middleware
app.use(passport.initialize());
// Passport config
require("./config/passport")(passport);
// Routes
app.use("/api/users", users);
app.use("/api/cryptocurrency", cryptoCurrency);
app.use("/api/wallet", wallet);
app.use("/api/email", email);
app.use("/static", express.static(path.join(__dirname, "../ecfcrypto/build/static"))
);

app.use("/image", express.static(path.join(__dirname, "../ecfcrypto/build/image"))
);

app.get("*", function (req, res) {
  res.sendFile("index.html", {
    root: path.join(__dirname, "../ecfcrypto/build/"),
  });
});
// app.use("*", (req, res) => {
//     res.sendFile(path.join(__dirname, 'public'))
// })

var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

httpServer.listen(5000);
// httpsServer.listen(5000);

// const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there
// app.listen(port, "0.0.0.0", () => console.log(`Server up and running on port ${port} !`));
