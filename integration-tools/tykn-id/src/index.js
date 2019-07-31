var indy = require('indy-sdk')
var fs = require('fs')
var untildify = require('untildify');
var helpers = require(`helpers`)

var tyknid = {}
var org = {}
org.wallet = {} 

org.wallet.getWallet = async function getWallet(walletPath,walletName,walletKey){
    var indyWalletConfig = {
        "id" : walletName,
        "storage_config":{"path": untildify(walletPath)}
    }
    var indyWalletCredentials = {
        "key" :walletKey
    }
    console.log(indyWalletConfig)
    if (!org.wallet.handle){
        var wh = await indy.openWallet(indyWalletConfig,indyWalletCredentials)
        return wh
    }else {
        return org.wallet.handle
    }
}
org.wallet.close = function close() {
    if(org.wallet.handle) {
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
            var walletHandle = await org.wallet.getWallet(config.walletPath,config.walletName,config.walletKey)
            console.log(walletHandle)
            org.wallet.handle =  walletHandle
        }else{
            throw Error("Config is not correct! walletPath is missing from config");
        }
        if(config.hasOwnProperty("orgSeed") && config["orgSeed"] && 
        config.hasOwnProperty("orgDID") && config["orgDID"]){
            org.seed =  config["orgSeed"]
            org.DID =  config["orgDID"]
        }else{
            throw Error("Config is not correct! walletPath is missing from config");
        }    
    }else{
        throw Error("Config is not correct! walletName is missing from config");
    }

}

tyknid.createConnection = async function createConnection (subjectDID,subjectVerKey) {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    return await indy.createPairwise(org.wallet.handle,subjectDID,indy.getMyDidWithMeta,"","")
}
tyknid.showDids = async function showDids () {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    var res = await indy.listMyDidsWithMeta(org.wallet.handle)
    console.log("DIDs from wallet >>>")
    console.log(res)
    return res
}

tyknid.getMainDID = async function getMyDID () {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    pa_identity = {
        "did": pa_did,
        "verkey": pa_verkey
     }
    var [orgParwiseDID] = await indy.createAndStoreMyDid(org.wallet.handle,{seed:org.seed})
}


tyknid.createConnection = async function createConnection(pa_did,pa_verkey,metadata) {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    pa_identity = {
        "did": pa_did,
        "verkey": pa_verkey
     }
    
    await indy.storeTheirDid(org.wallet.handle,pa_identity)
    await indy.createPairwise(org.wallet.handle, pa_did, org.DID ,metadata)
}
tyknid.createSchema = async function createSchema(schema_name,schema_version,schema_json) {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    var [schemaId, schema] = await indy.indy.issuerCreateSchema(org.DID, schema_name,schema_version,schema_json)
    schema_req = await indy.buildSchemaRequest(org.DID, schema)
    signed_schema_req = await indy.signRequest(org.wallet.handle, org.DID, schema_req)
    pool_response = await indy.submitRequest(pool.handle, signed_schema_req)
    console.log(pool_response)
    return pool_response
}
tyknid.createCredentialDefination = async function createCredentialDefination(schema_name,schema_version,schema_json) {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    var [credDefId, credDef] = await indy.issuerCreateAndStoreCredentialDef(org.wallet.handle, org.DID, schema_json, 'TAG', 'CL', { support_revocation: true })
    credDef_req = await indy.buildCredDefRequest(org.DID, credDef)
    pool_response = await indy.signAndSubmitRequest(pool.handle, org.wallet.handle, org.DID, credDef_req)
    console.log(pool_response)
    return pool_response
}
tyknid.createCredentialOffer = async function createCredentialOffer(credDefId) {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    
    var credentialOffer = await indy.issuerCreateCredentialOffer(wh, credDefId)
    return credentialOffer
}
tyknid.createCredential = async function createCredential(credentialOffer,credentialRequest,credentialJson) {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    
    var [cred, revId, revDelta] = await indy.issuerCreateCredential(wh, credentialOffer, credentialRequest, credentialJson, "","")
    return cred
}
tyknid.showConnections = async function showConnections() {
    if (!org.wallet.handle){
        throw Error("Wallet is not open or not accessible.");
    }
    var res = await indy.listPairwise(org.wallet.handle)
    console.log(res)
    return res
}
module.exports = tyknid