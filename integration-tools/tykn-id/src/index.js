var indy = require('indy-sdk')


var tyknid = {}

var walletHandle = null

/*
{
      "id": string, Identifier of the wallet.
            Configured storage uses this identifier to lookup exact wallet data placement.
      "storage_type": optional<string>, Type of the wallet storage. Defaults to 'default'.
                      'Default' storage type allows to store wallet data in the local file.
                      Custom storage types can be registered with indy_register_wallet_storage call.
      "storage_config": optional<object>, Storage configuration json. Storage type defines set of supported keys.
                        Can be optional if storage supports default configuration.
                        For 'default' storage type configuration is:
          {
             "path": optional<string>, Path to the directory with wallet files.
                     Defaults to $HOME/.indy_client/wallet.
                     Wallet will be stored in the file {path}/{id}/sqlite.db
          }
  }
*/

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