const express = require("express");
const router = express.Router();
const Wallet = require("../../models/wallet");
const CryptoAccount = require("send-crypto");
const axios = require('axios');
const contractData = require("../../contracts.json");
const Web3 = require('web3');
const ethers = require('ethers');

const api = axios.create({
    method: 'GET',
    baseURL: 'https://pro-api.coinmarketcap.com',
    headers: {
        'X-CMC_PRO_API_KEY': `2e6b8ca7-1b5e-4108-9ccf-4ed04712b1c7`,
        Accept: 'application/json',
        'Accept-Encoding': 'deflate, gzip',
    },
});

const getUserBalance = async (rpcURL, account) => {
    const web3 = new Web3(rpcURL);
    if (!account) {
        return new BigNumber(0)
    }
    try {
        const balance = await getEthBalance(account, web3);
        console.log(balance, "balance");
        return balance
    } catch (e) {
        return "GET_BALANCE_ERR"
    }
}

const getEthBalance = async (account, web3) => {
    return await web3.eth.getBalance(account);
}

router.post("/createwallet", async (req, res) => {
    const name = req.body.userName;
    const privateKey = CryptoAccount.newPrivateKey();
    const account = new CryptoAccount(privateKey);
    const bitcoinAddress = await account.address("BTC");
    const erc20Address = await account.address("ETH");
    const newWallet = new Wallet({
        name: name,
        privateKey: privateKey,
        bitcoinAddress: bitcoinAddress,
        ERC20Address: erc20Address,
        tokenlist: ["BTC", 'ETH', 'BNB']
    })
    newWallet
        .save()
        .then(() => res.json("success"))
        .catch(err => console.log(err))
})

router.get("/getwalletaddress/:name", (req, res) => {
    const name = req.params.name;
    Wallet.findOne({ name: name }).then(wallet => {
        if (wallet) {
            return res.status(200).json({ bitcoinAddress: wallet.bitcoinAddress, ERC20Address: wallet.ERC20Address });
        } else {
            return res.status(404).json("user not found.");
        }
    })
})

router.post("/savetokenlist", (req, res) => {
    Wallet.findOne({ name: req.body.userName }).then(user => {
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
router.get("/getwalletdata/:name", (req, res) => {
    let name = req.params.name;
    Wallet.findOne({ name: name })
        .then(async (user) => {
            if (user) {
                const tokenList = user.tokenlist;
                console.log(tokenList, "tokenList");
                privateKey = user.privateKey;
                const account = new CryptoAccount(privateKey);
                const address = await account.address("ETH");
                console.log(address, "address");
                let walletData;
                api(`/v1/cryptocurrency/quotes/latest?symbol=${tokenList.toString()}`)
                    .then(async function (response) {
                        try {
                            walletData = await Promise.all(tokenList.map(async (item, index) => {
                                if (item === "BTC" || item === "ETH")
                                    return {
                                        name: item,
                                        available: await account.getBalance(item),
                                        price: response.data.data[item].quote.USD.price,
                                        id: response.data.data[item].id,
                                        symbol: response.data.data[item].symbol
                                    }
                                else if (!!contractData[item].platform)
                                    return {
                                        name: item,
                                        available: await account.getBalance({ type: "ERC20", address: contractData[item].address }),
                                        price: response.data.data[item].quote.USD.price,
                                        id: response.data.data[item].id,
                                        symbol: response.data.data[item].symbol
                                    }
                                else {
                                    const rpcUrl = contractData[item].rpcUrl;
                                    const avaiable = parseInt(await getUserBalance(rpcUrl, address)) / (1000000000000000000);
                                    return {
                                        name: item,
                                        available: avaiable,
                                        price: response.data.data[item].quote.USD.price,
                                        id: response.data.data[item].id,
                                        symbol: response.data.data[item].symbol
                                    }
                                }
                            }))
                        } catch {
                            console.log("Promise.all", e);
                        }
                        // console.log(walletData, "walletData");
                        res.json(walletData);
                    })
                    .catch(function (error) {
                        res.json(error);
                    });
                // return res.status(200).json({ tokenList: user.tokenlist });
            }
            else {
                return res.status(400).json("user not found.");
            }
        })
})

router.post("/sendcrypto", (req, res) => {
    console.log(req.body);
    const url = "https://rpc.ankr.com/eth";
    var web3 = new Web3(url)
    web3.eth.getGasPrice().then((result) => { console.log(21000 * web3.utils.fromWei(result, 'ether')) })
    res.json("success");
})

router.get("/get", async (req, res) => {
    // const account = new CryptoAccount(privateKey);
    // console.log(await account.getBalance("ETH"));
    // console.log(await account.getBalance({
    //     type: "ERC20",
    //     name: "USDT"
    // }));
    const privateKey = CryptoAccount.newPrivateKey();
    const account = new CryptoAccount(privateKey);
    console.log(await account.address("ETH"));
    console.log(await account.address({
        type: "ERC20",
        name: "jhgjkhj"
    }));
    // const rpcUrl = "https://bscrpc.com";
    // const account = new CryptoAccount(privateKey);
    // const address = await account.address("ETH");
    // const result = await getUserBalance(rpcUrl, address);
    // res.json(result);
})
router.get("/send", async (req, res) => {
    const account = new CryptoAccount(privateKey, { network: "testnet" });
    const txHash = await account
        .send("n2Gq1kp796enozXBiTRqWp6hsYFM4o33EB", 0.00001, "BTC")
        .on("transactionHash", console.log)
        // > "3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688"
        .on("confirmation", console.log);
    res.json("success");
})
router.get("/get1", async (req, res) => {
    const account = new CryptoAccount(privateKey, { network: "testnet" });
    console.log(await account.address("BTC"));
    console.log(await account.getBalance("BTC"));
    res.json("success");
})
router.get("/convert", (req, res) => {
    res.json(contractData.reduce((a, v) => ({ ...a, [v.symbol]: !v.platform ? { address: "", platform: null } : { address: v.platform.token_address, platform: v.platform.name } })));
})
module.exports = router;