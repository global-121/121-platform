#Following instructions are supposed to be carried out on ubuntu

##  Setup env

`run setup_env.sh`

## Generate Secrets

`run generateSecrets.sh`


## Steps to generate the DID
### Start indy-cli by executing `indy-cli`. Then run the following commands

`wallet create <organisations_wallet_name> key=<password_for_wallet>`
`wallet open <organisations_wallet_name> key=<password_for_wallet>`
`did new seed=<organisation_seed> metadata=<Organisation_name>`

### This command will display the DIDs in the wallet. Copy the DID and Verkey you just created after this command
`did list`
### Share your DID and Verkey with Tykn

### This command will backup your wallet so that you can restore using this file in future
`wallet export export_path=/tmp/<Organisation_name> export_key=<password_for_wallet>`