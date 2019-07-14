var test = require('ava')
var tyknid = require('../')
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
    var data = [ { did: 'Th7MpTaRZVRYnPiabds81Y',
    verkey: 'FYmoFw55GeQH7SRFa37dkx1d2dZ3zUF8ckg7wmL7ofN4',
    tempVerkey: null,
    metadata: null },
  { did: 'P65pCL8QLaBNTQpAXD85KK',
    verkey: 'D3EZRRMCvHp62BE8gyUtayxNka6XmzuwCHS5uvP1do9G',
    tempVerkey: null,
    metadata: null } ]

    await tyknid.initSDK("/media/sami/DATA/work/repos/tykn/121-platform/integration-tools/tykn-id/ci/sampleconfig.json") 
    t.deepEqual(await tyknid.showDids(), data)
  })
  // test('test get my DID', async function (t) {
  //   await tyknid.initSDK("/media/sami/DATA/work/repos/tykn/121-platform/integration-tools/tykn-id/ci/sampleconfig.json") 
  //   t.deepEqual(await tyknid.getMyDID(), ["P65pCL8QLaBNTQpAXD85KK"])
  // })
  test('test get my DID', async function (t) {
    await tyknid.initSDK("/media/sami/DATA/work/repos/tykn/121-platform/integration-tools/tykn-id/ci/sampleconfig.json") 
    t.deepEqual(await tyknid.getDIDFromSeed(), ["P65pCL8QLaBNTQpAXD85KK"])
  })
