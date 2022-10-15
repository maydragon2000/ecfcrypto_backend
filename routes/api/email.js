const express = require("express");
const router = express.Router();
const { LocalStorage } = require("node-localstorage");
const mailgun = require("mailgun-js");
const DOMAIN = "ecfcrypto.com";
const { api_key } = require("../../config/keys");
const mg = mailgun({ apiKey: api_key, domain: DOMAIN, host: "api.eu.mailgun.net", });


router.post("/send", (req, res) => {
  console.log(req.body, "tokenName remove token");
  const email = req.body.email;
  const id = req.body.id;
  const name = req.body.name;
  var localStorage = new LocalStorage("./scratch");
  localStorage.setItem("id", id);
  const data = {
    from: "no-reply@ecfcrypto.com",
    to: email,
    subject: "ECF CRYPTO Confirm Email",
    replyTo:"helpdesk@ecfcrypto.com",
    text: "Testing some Mailgun awesomness!",
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
    letter-spacing: normal;">Please confirm your email (${email}) by clicking the button below.</p>
    <a style="background: #fca253;
    color: white;
    font-weight: 500;
    display: inline-block;
    padding: 10px 35px;
    margin: 6px 8px;
    text-decoration: none;
    border-radius: 2px;" href='https://www.ecfcrypto.com/PersonalInformation/${id}'>
    Confirm
    </a>
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
    if(!error)
        res.json("success");
    else 
        res.json("error");
  });
});

router.post("/checkemailid", (req, res) => {
  const id = req.body.id;
  var localStorage = new LocalStorage("./scratch");
  console.log(localStorage.getItem("id"), "node local id");
  if (localStorage.getItem("id") === id) {
    return res.status(200).json("correct id");
  } else return res.status(404).json("incorrect id");
});

module.exports = router;
