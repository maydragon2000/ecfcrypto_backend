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
        'X-CMC_PRO_API_KEY': `87aee1d8-abf9-4016-96a9-b861d10325c1`,
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
        tokenlist: ["BTC", 'ETH', 'USDT']
    })
    console.log(erc20Address, 'erc20Address');

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
                                    console.log(item, "delete")
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

router.post("/removeToken", (req, res) => {
    console.log(req.body, "tokenName remove token");
    const name = req.body.name;
    const tokenName = req.body.tokenName;
    Wallet.findOne({ name: name })
        .then((user) => {
            if (user) {
                console.log(user, "user");
                var tokenList = user.tokenlist;
                console.log(tokenList, "before tokenlist")
                for(i =0; i < tokenList.length; i++){
                    if(tokenList[i] == tokenName)
                        tokenList.splice(i, 1);
                }
                console.log(tokenList, "after tokenList");
                user.tokenlist = tokenList;
                user.save()
                .then(() => res.status(200).json("successful"))
                .catch(err => console.log(err));
            }
            else {
                return res.status(400).json("user not found.");
            }
        })
})

router.get("/getgasfee",  (req, res) => {
    const url = "https://rpc.ankr.com/eth";
    var web3 = new Web3(url)
     web3.eth.getGasPrice().then((result) => {
         console.log(21000 * web3.utils.fromWei(result, 'ether'));
         const gasfee = 21000 * web3.utils.fromWei(result, 'ether');
         res.json(gasfee);
        })
})

router.post("/sendcrypto", (req, res) => {
    console.log(req.body, "send crypto");
    const name = req.body.userName;
    const tokenName = req.body.tokenName;
    const sendAddress = req.body.sendAddress;
    const sendAmount = Number(req.body.sendAmount);
    console.log(sendAmount, "senfAmount");
    Wallet.findOne({ name: name })
        .then( async (user) => {
            if (user) {
                const privateKey = user.privateKey;
                const account = new CryptoAccount(privateKey);
                if (tokenName === "BTC" || tokenName === "ETH")
                    {
                        account.send(sendAddress, sendAmount, tokenName)
                        .then((result) => {
                            console.log(result, "send success");
                           return res.status(200).json(result);
                        })
                        .catch((error) =>{
                            console.log(error, "error")
                            if (error == "Insufficient balance to broadcast transaction")
                                console.log("also ok");
                            if(error.code === "INSUFFICIENT_FUNDS"){
                                console.log("ok");
                                return res.status(402).json("INSUFFICIENT_FUNDS");
                            }
                            else{
                                return res.status(401).json(error);
                            }
                        });
                    }
                    else {
                        account.send(sendAddress, sendAmount, {
                            type:"ERC20",
                            address: contractData[tokenName].address
                        })
                        .then((res) => {
                            console.log(res, "send success");
                            return res.status(200).json(res);
                        })
                        .catch((error) =>{
                            if(error.code === "INSUFFICIENT_FUNDS"){
                                return res.status(400).json("INSUFFICIENT_FUNDS");
                            }
                            else{
                                return res.status(401).json(error);
                            }
                        });
                    }
            }
            else {
                return res.status(400).json("user not found.");
            }
        })
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

const api1 = axios.create({
    method: 'GET',
    baseURL: 'https://blockchain.info/rawaddr',
    headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'deflate, gzip',
        Access_Control_Allow_Headers:'*'
    },
    data:{
        cors:true
    }
});

router.get("/send", async (req, res) => {
    const item = "BNB";
    const rpcUrl = contractData[item].rpcUrl;
    // const account1 = new CryptoAccount("355e41a2342e33f02a3ad568740dac5f27d633f7da916117a9255c1d84e22e9a", { network: "testnet" });
    // console.log(await account.address("btc"), "address");
    // const account1 = new CryptoAccount("15a629bfac90a01eb25a68aec65753540863fd7da48f68bcafe084f50425d39b", { network: "rinkeby" });
    // console.log(await account1.address("btc"), "address");
    // console.log(await account1.getBalance("btc"), "balance");

    // const address = await account.address("ETH");
    // const txHash = await account1
    //     .send("mrgHpC7GF3dGeh3AomygC3rnrdUg34rNNL", 0.00001, "btc")
    //     .on("transactionHash", console.log)
    //     .on("confirmation", console.log);
    // const available = parseInt(await getUserBalance(rpcUrl, address)) / (1000000000000000000);
    // console.log(available, "balance")
    // res.json("success");
    api1(`/bc1q8lllgmvnq7gff6eaf3qt5saw3rhdsn99ykg463`)
    .then((res) => {
        console.log(res, "res")
    })
    .catch((res) => {
        console.log(res, "res");
    }
)
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