var indy = require('indy-sdk')


var tyknid = {}

var walletHandle = null


var wallet = {} 
wallet.getWallet = function getWallet(path,id,password){
    var config = {}
    config.id = id
    config.storage_config = { "path" : path }
    var credentials = {"key":password}
    if (!wallet.handle){
        return await indy.openWallet(config,credentials)
    }else {
        return wallet.handle
    }
}
wallet.close = function close() {
    if(wallet.handle) {
        await indy.closeWallet()
    }
}
tyknid.initSDK = function initSDK(pathToConfig) {
    var config = File.read(pathToConfig)

    if(config.hasOwnProperty("walletName") && config["walletName"] ){
        if(config.hasOwnProperty("walletPath") && config["walletPath"] ){
            indy.openWallet("")
        }else{
            throw "Config is not correct! walletPath is missing from config"
        }    
    }else{
        throw "Config is not correct! walletName is missing from config"
    }

}

tyknid.createConnection = function createConnection (subjectDID,subjectVerKey) {
    indy.createPairwise(walletHandle,subjectDID,"","","")
}