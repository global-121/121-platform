import requests
import json
import random
import string
from termcolor import colored
import pprint

global PROGRAM_ID
PROGRAM_ID = '3'

global PRINT_RESPONSE
PRINT_RESPONSE = True


def main():
    randomDidString = randomString(22)
    randomDid = "did:sov:" + randomDidString
    print(randomDid, '\n')

    t = testApi(randomDid)

    t.setupProgram()

    t.getWalletDid()

    t.setupConnection()

    t.getIdCredentials()

    t.getCredentials()

    t.proof()


class testApi:

    def __init__(self, didPA):
        self.r = Request()
        self.didPA = didPA
        self.storagePA = {}

    def setupProgram(self):
        printAction('HO', 'Unpublishes a program to reset the sequence')
        self.r.postRequest('programs/unpublish/' + PROGRAM_ID)

        printAction('HO', 'Publishes a program')
        self.r.postRequest('programs/publish/' + PROGRAM_ID)

    def getWalletDid(self):
        printAction(
            'PA-PHONE', 'PA calls POST to create a wallet sovrin ledger')
        walletPost = {
            "wallet": {
                "id": "test",
                "passKey": "test"
            },
            "correlation": {
                "correlationID": "test"
            }
        }
        self.r.postSovrin('wallet', walletPost)

        printAction('PA-PHONE', 'PA calls POST to get a DID from sovrin ledger')
        didPost = {
            "wallet": {
                "id": "test",
                "passKey": "test"
            },
            "correlation": {
                "correlationID": "test"
            }
        }
        didReponse = self.r.postSovrin('did', didPost)
        self.didPA = "did:sov:" + didReponse['did']
        self.didPAShort = didReponse['did']

    def setupConnection(self):
        printAction('PA', 'Calls GET connection request')
        connectionRequest = self.r.getRequest('sovrin/create-connection')

        printAction('PA', 'Calls POST connection-response')
        connectionResponse = {
            "did": self.didPA,
            "verkey": "verkey:sample",
            "nonce": "123456789",
            "meta": "meta:sample"
        }
        self.r.postRequest(
            'sovrin/create-connection', connectionResponse)

    def getIdCredentials(self):
        printAction('PA', 'Calls GET credential offer ID')
        idCredOfferResponse = self.r.getRequest(
            'sovrin/credential/offer/' + PROGRAM_ID)

    def getCredentials(self):
        printAction('PA', 'Calls GET credential offer')
        credOfferResponse = self.r.getRequest(
            'sovrin/credential/offer/' + PROGRAM_ID)

        printAction(
            'PA', 'PA calls GET attributes for credential/program')
        programData = self.r.getRequest('programs/' + PROGRAM_ID)

        printAction(
            'PA', 'PA calls GET program to get program details, such as cred def id')
        self.r.getRequest('sovrin/credential/attributes/' + PROGRAM_ID)

        printAction(
            'PA-PHONE', 'PA calls POST to create a credential request on his phone')
        credRequestPost = {
            "wallet": {
                "id": "test",
                "passKey": "test"
            },
            "correlation": {
                "correlationID": "test"
            },
            "credDefID": programData['credDefId'],
            "credentialOffer": credOfferResponse['credOfferJsonData'],
            "did": self.didPAShort
        }
        credentialRequest = self.r.postSovrin(
            'credential/credreq', credRequestPost)

        printAction('PA', 'calls POST to store credential-request to server')
        credentialRequestPost = {
            "did": self.didPA,
            "programId": int(PROGRAM_ID),
            "encryptedCredentialRequest": json.dumps(credentialRequest)
        }
        self.r.postRequest('sovrin/credential/request', credentialRequestPost)

        prefilledAnswers = {
            "did": self.didPA,
            "programId": int(PROGRAM_ID),
            "credentialType": "program",
            "attributes": [
                {
                    "attributeId": 1,
                    "attribute": "nr_of_children",
                    "answer": 32
                },
                {
                    "attributeId": 2,
                    "attribute": "roof_type",
                    "answer": 0
                }
            ]
        }
        printAction('PA', 'PA calls POST prefilled-answers to system')
        self.r.postRequest('sovrin/credential/attributes', prefilledAnswers)

        printAction('AW', 'AW calls GET prefilled-answers')
        getJson = {'programId': int(PROGRAM_ID)}
        self.r.getRequest('sovrin/credential/answers/' + self.didPA, getJson)

        issueCredentialData = {
            "did": self.didPA,
            "programId": int(PROGRAM_ID),
        }

        printAction('AW', 'AW calls POST issue credential')
        self.r.postRequest('sovrin/credential/issue',  issueCredentialData)

        printAction(
            'PA', 'PA calls get issued credential to get it to his phone')
        credential = self.r.getRequest('sovrin/credential/' + self.didPA)

        printAction('PA-PHONE', 'PA stores received credential in wallet')
        credentialFormat = json.loads(credential['message'])
        storeCredentialData = {
            "credDefID": programData['credDefId'],
            "credentialRequestMetadata": credentialRequest['credentialRequestMetadata'],
            "credential":  credentialFormat['credential'],
            "wallet": {
                "id": "test",
                "passKey": "test"
            },
            "correlation": {
                "correlationID": "test"
            }
        }
        pprint.pprint(storeCredentialData)
        self.r.postSovrin('credential/store', storeCredentialData)

        printAction(
            'PA', 'PA asks the server to delete his credentials after they are safely stored in his wallet')
        self.r.deleteRequest('sovrin/credential/' + self.didPA)

    def proof(self):
        printAction('PA', 'PA gets proof request')
        proofRequest = self.r.getRequest(
            'sovrin/proof/proofRequest/' + PROGRAM_ID)

        printAction('PA', 'PA gets proof from wallet using the proofrequest')
        getProofFromWalletPost = {
            "proofRequestJsonData": json.dumps(proofRequest),
            "wallet": {
                "id": "test",
                "passKey": "test"
            },
            "correlation": {
                "correlationID": "test"
            }
        }
        proofReturn = self.r.postSovrin(
            'proof/request', getProofFromWalletPost)

        proofInclusion = {
            "did": self.didPA,
            "programId": int(PROGRAM_ID),
            "encryptedProof": proofReturn['proof']
        }
        printAction('PA', 'PA posts proof and asks for inclusion')
        self.r.postRequest('programs/includeMe', proofInclusion)

        inclusionStatusPost = {
            "did": self.didPA
        }
        printAction('PA', 'PA posts proof and asks for inclusion')
        self.r.postRequest('programs/inclusionStatus/' +
                           PROGRAM_ID, inclusionStatusPost)


class Request:
    def __init__(self):
        self.baseurl = 'http://localhost:3000/api/'
        self.userIMS = 'http://11.0.0.5:50003/api/'

    def getRequest(self, extension, params='{}'):
        completeUrl = self.baseurl + extension
        response = requests.get(completeUrl,
                                params=params)
        return self.handleResponse(response)

    def deleteRequest(self, extension, params='{}'):
        completeUrl = self.baseurl + extension
        response = requests.delete(completeUrl,
                                   params=params)
        return self.handleResponse(response)

    def postRequest(self, extension, data=None):
        completeUrl = self.baseurl + extension
        response = requests.post(completeUrl,
                                 json=data)

        return self.handleResponse(response)

    def postSovrin(self, extension, data):
        completeUrl = self.userIMS + extension
        response = requests.post(completeUrl,
                                 json=data)

        return self.handleResponse(response)

    def handleResponse(self, response):
        printColor(response.url, 'magenta')
        printStatusCode(response.status_code)
        if len(response.text) > 0:
            jsonResult = json.loads(response.text)

        else:
            jsonResult = ''

        if PRINT_RESPONSE == True:
            pprint.pprint(jsonResult)
        print('\n\n')
        return jsonResult


def randomString(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for i in range(stringLength))


def printAction(who, what):
    print(colored(' ' + who + ': ', 'blue', 'on_white', attrs=['bold']), what)


def printStatusCode(code):
    if code == 200 or code == 201:
        printColor(code, 'green')
    elif code == 401:
        printColor(code, 'yellow')
    else:
        printColor(code, 'red')


def printColor(message, color):
    print(colored(message, color))


if __name__ == "__main__":
    main()
