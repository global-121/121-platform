import requests
import json
import random
import string
from termcolor import colored
import pprint

global PROGRAM_ID
PROGRAM_ID = '1'

global PRINT_RESPONSE
PRINT_RESPONSE = True


def main():
    randomDidString = randomString(22)
    randomDid = "did:sov:" + randomDidString
    print(randomDid, '\n')

    t = testApi(randomDid)

    t.setupConnection()

    t.getCredentials()

    t.proof()


class testApi:

    def __init__(self, didPA):
        self.r = Request()
        self.didPA = didPA

    def setupConnection(self):
        printAction('HO', 'Publishes a program')
        self.r.postRequest('programs/publish/1')

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

    def getCredentials(self):
        printAction('PA', 'Calls POST credential offer')
        self.r.getRequest('sovrin/credential/offer/' + PROGRAM_ID)

        printAction('PA', 'PA calls GET attributes for credential/program')
        self.r.getRequest('sovrin/credential/attributes/' + PROGRAM_ID)

        credentialRequest = {
            "did": self.didPA,
            "programId": 1,
            "encryptedCredentialRequest": "string"
        }

        printAction('PA', 'calls POST credential-request to system')
        self.r.postRequest('sovrin/credential/request', credentialRequest)

        prefilledAnswers = {
            "did": self.didPA,
            "programId": 1,
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
        self.r.getRequest('sovrin/credential/answers/' + self.didPA)

        issueCredentialData = {
            "did": self.didPA,
            "programId": 1,
            "credentialJson": {}
        }

        printAction('AW', 'AW calls POST issue credential')
        self.r.postRequest('sovrin/credential/issue',  issueCredentialData)

        printAction('AW', 'AW calls POST issue credential')
        self.r.getRequest('sovrin/credential/' + self.didPA)

    def proof(self):
        printAction('PA', 'PA gets proof request')
        self.r.getRequest('sovrin/proof/proofRequest/' + PROGRAM_ID)

        proofInclusion = {
            "did": self.didPA,
            "programId": 1,
            "encryptedProof": "superEncrypted"
        }

        printAction('PA', 'PA posts proof and asks for inclusion')
        self.r.postRequest('programs/includeMe', proofInclusion)


class Request:
    def __init__(self):
        self.baseurl = 'http://localhost:3000/api/'

    def getRequest(self, extension, params='{}'):
        completeUrl = self.baseurl + extension
        response = requests.get(completeUrl,
                                params=params)
        return self.handleResponse(response)

    def postRequest(self, extension, data=None):
        completeUrl = self.baseurl + extension
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
