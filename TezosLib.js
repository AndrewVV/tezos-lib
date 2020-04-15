require('dotenv').config();
const fetch = require('node-fetch');
const conseiljs = require('conseiljs');
const multicoinAddressValidator = require('multicoin-address-validator');
const myTestAddress = process.env.MY_TEST_ADDRESS
const myTestPublicKey = process.env.MY_TEST_PUBLIC_KEY
const myTestPrivateKey = process.env.MY_TEST_PRIVATE_KEY
const TEZOS_TEST_NODE = process.env.TEZOS_TEST_NODE
const API_DEV_KEY = process.env.API_DEV_KEY
const network = 'carthagenet';
const TZ_DECIMALS = 6;

// url and apiKey you could get here https://nautilus.cloud/
const conseilServer = { url: "https://conseil-dev.cryptonomic-infra.tech:443", apiKey: API_DEV_KEY, network };

class TezosLib {
    constructor(){
        // for test
        this.generateAddress()
    }

    async generateAddress(){
        try {
            const mnemonic = conseiljs.TezosWalletUtil.generateMnemonic();
            const keystore = await conseiljs.TezosWalletUtil.unlockIdentityWithMnemonic(mnemonic, '');
            console.log(keystore)
            return {
                address: keystore.publicKeyHash,
                privKey: keystore.privateKey
            }
        } catch (error) {
            console.error(error)
        }
    }

    async getBalance(address){
        try {
            const data = await conseiljs.TezosConseilClient.getAccount(conseilServer, network, address);
            console.log(data)
            let balance = data.balance;
            balance = balance/(Math.pow(10, TZ_DECIMALS));
            return balance;
        } catch (error) {
            console.error(error)
        }
    }

    async sendTransaction(to, amount, fee){
    	try {
            amount = amount*(Math.pow(10, TZ_DECIMALS));
            fee = fee*(Math.pow(10, TZ_DECIMALS));
            const keystore = {
                publicKey: myTestPublicKey,
                privateKey: myTestPrivateKey,
                publicKeyHash: myTestAddress,
                seed: '',
                storeType: conseiljs.StoreType.Fundraiser
            };
            const result = await conseiljs.TezosNodeWriter.sendTransactionOperation(TEZOS_TEST_NODE, keystore, to, amount, fee, '',);
            const txHash = result.operationGroupID;
            console.log('txHash', txHash, typeof txHash)
			return txHash;
    	} catch (error) {
            console.error(error);
            return "SEND_TX_FAILED";
    	}
    }
    
    async activateAccount() {
        try {
            const keystore = {
                publicKey: myTestPublicKey,
                privateKey: myTestPrivateKey,
                publicKeyHash: myTestAddress,
                seed: '',
                storeType: conseiljs.StoreType.Fundraiser
            };
            const result = await conseiljs.TezosNodeWriter.sendIdentityActivationOperation(TEZOS_TEST_NODE, keystore, secret);
            console.log(result)
            console.log(`Injected operation group id ${result.operationGroupID}`)
            return result.operationGroupID;
        } catch (error) {
            console.error(error);
        }
    }

    async revealAccount() {
        try {
            const keystore = {
                publicKey: myTestPublicKey,
                privateKey: myTestPrivateKey,
                publicKeyHash: myTestAddress,
                seed: '',
                storeType: conseiljs.StoreType.Fundraiser
            };
            const result = await conseiljs.TezosNodeWriter.sendKeyRevealOperation(TEZOS_TEST_NODE, keystore);
            console.log(`Injected operation group id ${result.operationGroupID}`);           
        } catch (error) {
            console.error(error);
        }
    }

    async getTxHistory(address){
        try {
            const url = `${process.env.TEZOS_TEST_HISTORY_NODE}explorer/account/${address}/op?order=desc&type=transaction&limit=5`
            let result = [];
            let allTx = await fetch(url).then(res => {
			        return res.json()
                })
            allTx = allTx.ops
            const rate = "1.93";
            for(let txKey in allTx){
                let tx = allTx[txKey];
                let timeStamp = tx.time;
                const hash = tx.hash;
                const txFee = tx.fee;
                const amount = tx.volume;
                const from = tx.sender;
                const to = tx.receiver;
                let status;
                if (tx.is_success === true) status = "CONFIRM";
                let action;
                if(to != from){
                    if(address == to){
                        action = "DEPOSIT";
                    }else if(address == from){
                        action = "SEND";
                    }
                }else{
                    action = "SELF";
                }
                const moneyQuantity = (amount*rate).toFixed(2); 
                const id = result.length+1;
                const txData = this.formatTxData(timeStamp, id, action, status, amount, moneyQuantity, hash, from, to, txFee);
                result.push(txData);
            }
            console.log(result)
            return result;
        } catch (error) {
            console.error(error)
        }
    }

    formatTxData(timeStamp, id, action, status, amount, moneyQuantity, hash, from, to, txFee){
		let txData = {
            timeStamp,
            id,
            action,
            status,
            cryptoAmount: amount,
            moneyQuantity,
            hash,
            explorer: `https://carthagenet.tezos.id/${hash}`,
            fromAddress: from,
            toAddress: to,
            txFee, 
		};
		return txData;
    }

    async getFee(){
        try{
            const fees = await conseiljs.TezosConseilClient.getFeeStatistics(conseilServer, network, conseiljs.OperationKindType.Transaction);
            const result = {
                SLOW: fees[0]['low']/(Math.pow(10, TZ_DECIMALS)),
                AVARAGE: fees[0]['medium']/(Math.pow(10, TZ_DECIMALS)),
                FAST: fees[0]['high']/(Math.pow(10, TZ_DECIMALS)),
            }
            return result;
        } catch (e) {
            console.error(e)
        }
    }
    // return boolean. address is valid or not
    async validateAddress(address){
        try {
            const result = await multicoinAddressValidator.validate(address, "XTZ");
            console.log(result)
            return result;
        } catch (error) {
            console.error(error)
            return false;
        }
    }

}

let tezosLib = new TezosLib();