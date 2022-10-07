const express = require("express");
const router = express.Router();
const axios = require('axios');

const api = axios.create({
    method: 'GET',
    baseURL: 'https://pro-api.coinmarketcap.com',
    headers: {
        'X-CMC_PRO_API_KEY': `87aee1d8-abf9-4016-96a9-b861d10325c1`,
        Accept: 'application/json',
        'Accept-Encoding': 'deflate, gzip',
    },
});
router.get("/getcoins", (req, res) => {
    api('/v1/cryptocurrency/listings/latest?limit=20')
        .then(response => response.data)
        .then(value => res.json(value.data))
        .catch(err => console.log(err));
});

router.post("/getcoins", (req, res) => {
    console.log(req.body, "req")
    api(`/v1/cryptocurrency/listings/latest?limit=${req.body.marketDataCount}`)
        .then(response => response.data)
        .then(value => res.json(value.data))
        .catch(err => console.log(err));
});
router.get("/getcoindetail/:coin", (req, res) => {
    let coin = req.params.coin;
    api(`/v1/cryptocurrency/quotes/latest?symbol=${coin}`)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
});
router.get("/getMainCoin", (req, res) => {
    console.log("here");
    api(`/v1/cryptocurrency/quotes/latest?symbol=btc,bnb,eth,xrp,ADA,SOL,MATIC,LTC`)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
});
router.get("/coinHistory/:coin", (req, res) => {
    const coin = req.params.coin;
    api(`/v1/cryptocurrency/ohlcv/latest?symbol=${coin}`)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
});
router.get("/getlosers", (req, res) => {
    api(`/v1/cryptocurrency/trending/gainers-losers?sort_dir=asc`)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
});
router.get("/getgainers", (req, res) => {
    api(`/v1/cryptocurrency/trending/gainers-losers?sort_dir=desc`)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
});
router.get("/getnewmarket", (req, res) => {
    api(`/v1/cryptocurrency/listings/new`)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
});
router.post("/watchlistCoin", (req, res) => {
    const coinList = req.body.tokenlist.toString();
    console.log(coinList, "coinList");
    api(`/v1/cryptocurrency/quotes/latest?symbol=${coinList}`)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
});
module.exports = router;
