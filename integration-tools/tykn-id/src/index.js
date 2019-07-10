var indy = require('indy-sdk')
var fs = require('fs')
var untildify = require('untildify');


var tyknid = {}

var walletHandle = null


var wallet = {} 
wallet.getWallet = async function getWallet(walletPath,walletName,walletKey){
    var indyWalletConfig = {
        "id" : walletName,
        "storage_config":{"path": untildify(walletPath)}
    }
    var indyWalletCredentials = {
        "key" :walletKey
    }
    console.log(indyWalletConfig)
    if (!wallet.handle){
        var wh = await indy.openWallet(indyWalletConfig,indyWalletCredentials)
        return wh
    }else {
        return wallet.handle
    }
}
wallet.close = function close() {
    if(wallet.handle) {
        indy.closeWallet()
    }
}
tyknid.initSDK = async function initSDK(pathToConfig) {
    var config = {}
    try{
        var config = JSON.parse(fs.readFileSync(pathToConfig))
    }
    catch(err){
        throw Error("Unable to find config file or invalid json in config file.");
    }
    

    if(config.hasOwnProperty("walletName") && config["walletName"] ){
        if(config.hasOwnProperty("walletPath") && config["walletPath"] ){
            var walletHandle = await wallet.getWallet(config.walletPath,config.walletName,config.walletKey)
            console.log(walletHandle)
            wallet.handle =  walletHandle
        }else{
            throw Error("Config is not correct! walletPath is missing from config");
        }    
    }else{
        throw Error("Config is not correct! walletName is missing from config");
    }

}

tyknid.createConnection = async function createConnection (subjectDID,subjectVerKey) {
    if (!wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    return await indy.createPairwise(walletHandle,subjectDID,indy.getMyDidWithMeta,"","")
}
tyknid.showDids = async function showDids () {
    if (!wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    var res = await indy.listMyDidsWithMeta(wallet.handle)
    console.log(res)
    return res
}

tyknid.getMainDID = async function getMyDID () {
    if (!wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    var myDIDs = await indy.listMyDidsWithMeta(wallet.handle)
    
    console.log(res)
    return res
}

tyknid.createConnection = async function createConnection () {
    if (!wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    var res = await indy.createPairwise(wallet.handle,"VsKV7grR1BUE29mG2Fm2kX","P65pCL8QLaBNTQpAXD85KK","mobile1")
    console.log(res)
    return res
}
module.exports = tyknid