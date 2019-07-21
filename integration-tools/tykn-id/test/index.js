import {serial as test} from 'ava';
var indy = require('indy-sdk')
var cuid = require('cuid')
var fs = require('fs');
var tyknid = require('../')
var tempy = require('tempy')
var initTestPool = require('./helpers/initTestPool')

var orgConfigPath = tempy.file()
var orgWalletConfig = { 'id': 'orgWallet-' + cuid() }
var orgWalletCredentials = { 'key': 'key' }
var pa1ConfigPath =  tempy.file()
var paWalletConfig = { 'id': 'orgWallet-' + cuid() }
var paWalletCredentials = { 'key': 'key' }

var initTestWallets= async function initTestWallets(){
  var orgSeed= String(cuid() + cuid()).substring(0,32)
  var pa1Seed=String(cuid() + cuid()).substring(0,32)
  
  
  
  await indy.createWallet(orgWalletConfig, orgWalletCredentials)
  var wh = await indy.openWallet(orgWalletConfig,orgWalletCredentials)
  var [orgdid,orgverkey] = await indy.createAndStoreMyDid(wh,{seed:orgSeed})
  indy.closeWallet(wh)
  var orgConfig = {
    "walletName": orgWalletConfig.id,
    "walletKey" : orgWalletCredentials.key,
    "walletPath":"~/.indy_client/wallet",
    "orgSeed" : orgSeed,
    "orgDID" : orgdid,
    "orgVerKey" : orgverkey
}
  fs.writeFile(orgConfigPath,  JSON.stringify(orgConfig), 'utf8');

  
  
  await indy.createWallet(paWalletConfig, paWalletCredentials)
  var pa1Config = {
    "walletName": paWalletConfig.id,
    "walletKey" : paWalletCredentials.key,
    "walletPath":"~/.indy_client/wallet",
    "orgSeed" : pa1Seed
}
  fs.writeFile(pa1ConfigPath, JSON.stringify(pa1Config), 'utf8');
}

test.before(async(t) =>{
  await initTestWallets()
  var [trusteeDid] = await indy.createAndStoreMyDid(wh, { seed: '000000000000000000000000Trustee1' })
  var req = await indy.buildNymRequest(trusteeDid, myDid, myVerkey, null, 'TRUSTEE')
  var res = await indy.signAndSubmitRequest(pool.handle, wh, trusteeDid, req)
  t.is(res.result.txn.data.verkey, myVerkey)
})

test.after(t =>{
  indy.deleteWallet(orgWalletConfig, orgWalletCredentials)
  indy.deleteWallet(paWalletConfig, paWalletCredentials)
})

test('test error if config is absent', async (t)=>{
    var err = await t.throwsAsync(async ()=> {
      await tyknid.initSDK("wrongPath") 
      }, Error)
    t.is( err.message, "Unable to find config file or invalid json in config file.")
  })

test('test error if wallet is not open', async function (t) {
    var err = await t.throwsAsync(async function () {
        await tyknid.createConnection("someDID","someVerkey") 
      }, Error)
    t.is( err.message, "Wallet is not open or not accessible.")
  })
  
  test('test show dids from wallet', async function (t) {
    await tyknid.initSDK(orgConfigPath) 
    t.not((await tyknid.showDids())[0].did, "")
  })

  test('test create connection show connections', async function (t) {
    var metadata = JSON.stringify({mob:"234"})
    await tyknid.initSDK(orgConfigPath) 
    await tyknid.createConnection("H6drUiac2nETrfJCVZW2he","H6drUiac2nETrfJCVZW2heRCJEsRcjny2CpfxAcehyD1",metadata)
    t.deepEqual((await tyknid.showConnections())[0].metadata, metadata)
  })

  test('test create schema', async function (t) {
    var pool = await initTestPool()
    var schemaName = 'schema-ho-' + cuid()
    var [schemaId, schema] = await indy.issuerCreateSchema(myDid, schemaName, '1.0', ['name', 'age'])
    t.is(true,false)
  })
  test('test create credentialdef', async function (t) {
    t.is(true,false)
  })
  test('test create credential', async function (t) {
    t.is(true,false)
  })
  test('test verify credential', async function (t) {
    t.is(true,false)
  })

