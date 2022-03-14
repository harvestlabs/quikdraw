# Quikdraw
### A CLI sidekick to [Kontour](https://kontour.io), the superpowered web3 private testnet.


## Getting started
1. Install Quikdraw globally
   ```
   npm install -g quikdraw
   ```
2. Navigate to your smart contract repo. This is normally the path where you've installed Truffle or Hardhat.
3. Initialize your `.quikdrawconfig` by answering a few simple questions (this example is for a Truffle repo)
    ```
    quikdraw init
    ```
4. To learn more about the options in `.quikdrawconfig`, [go here](#FAQ)
5. Write some <b>awesome awesome contract code</b>
6. You're ready to test your contracts and your client dev teammate is waiting for you to deploy to a shared testnet. Have no fear, you don't need to go to a faucet or upload those pesky ABIs anywhere! Just run
   ```
   quikdraw go
   ```
7. Your contracts will be compiled and added to a new project as a new draft version. We'll give you a handy Kontour link and save these settings for the next time around.
8. Enjoy using Kontour to browse your private test node and share a one-click SDK url to your teammates! Whenever you want to deploy a new round of contracts, just `quikdraw go` and your team will automatically be up to date, with <b>zero address sharing, zero ABIs, zero test tokens, and zero client changes necessary!</b>

## Automatic deploys
Kontour supports automated deploys via `quikdraw deploy` using a script of your choice. Deploy scripts are incredibly easy to write:
```
// migrate.js
const migrate = require("quikdraw").migrate;

async function main() {
    await migrate("SimpleStorage")
    await migrate("MyContractHere", [arg1, arg2, arg3])
}
main()
```

Adding `"deploy": "./migrate.js"` to your `.quikdrawconfig` will trigger this script each time you run `quikdraw deploy`, and your contracts will show up in the latest Kontour instance.


<a name="FAQ"></a>
## Details

### .quikdrawconfig

This is a JSON configuration file for quikdraw and is created by `quikdraw init`. It has the following fields:

- `type`: [truffle | hardhat]
- `truffleConfigPath`: For Truffle users only, points to your Truffle config file
- `apiKey`: Your Kontour API key - this authenticates Quikdraw on our servers
- `projectId`: Your Kontour project ID - you can change this if you're switching projects, but likely won't have to!
- `versionId`: The current Kontour version that you're working on. If you publish a version and move on, change this or erase it to have Quikdraw make you a new one.
- `contracts`: A comma-separated list of regexes, Quikdraw will only upload contracts whose name matches this. Leave it empty to upload everything.
- `deploy`: The path to a script that you'd like to run using `quikdraw deploy`  [(more here)](#DEPLOY)

### quikdraw init
```                                                                                         
Are you using truffle or hardhat to manage your environment?
(1) truffle
(2) hardhat
(3) I'm not sure how to get started, help me out? [default - 3]: 1

Location of your truffle-config.js [./truffle-config.js]: ./truffle-development.config.js

Grab your API key from https://kontour.io/key (required!): *********************

Default projectId [null]:

Comma-separated list of contracts to upload to Kontour [.*]: Mint.*,SwapRouter
```

Let's break this down:
- Quikdraw only supports Truffle and Hardhat projects right now.
- For Truffle projects, we require a path to the config file that you want to use for contract compilation.
- You'll need your API key to grant access to Kontour, [so grab one here!](https://kontour.io/key)
- Don't worry if you don't have a project ID yet, Quikdraw will make one for you automatically!
- If you want to only upload a subset of contracts, putting regexes here will filter out any names that don't match. Leave it empty to upload everything :)

### quikdraw go
```
Uploading compiled sources to Kontour now...
Uploading Bounty
Uploading VotableBounty
Uploaded Bounty
Uploaded VotableBounty

Find your project at https://kontour.io/versions/bd47e6e7-1311-4a7c-8137-f80361c6d2ee
Do you want to update your current project settings to this draft? [Y/n]: Y
```
Under the hood, Quikdraw triggers your project's Truffle or Hardhat compilation. It then takes those compiled artifacts and sends them to your private Kontour project, which makes them available to add to your node. Whenever you make changes and compile a new set of contracts, your Kontour draft will update to those new versions.

Client developers can point to any version of your smart contract APIs that they want by changing a single URL parameter, and Kontour will make sure all of the web3.js SDKs are automatically generated and kept up to date! 

<a name="DEPLOY"></a>
### quickdraw deploy
```
Deploying SimpleStorage
SimpleStorage was deployed at 0x5DC6eD4eC66c291eDDFebFF37A17023B17224fEe!
Check out https://kontour.io/instances/13090f7f-aa89-4b1d-a906-ab2cf75d636e
```

If you've linked a migration script under your `.quikdrawconfig`, this command will run that script and deploy the contracts in your version automatically. This deploy is executed by your test node, so you don't have to attach an address or worry about gas fees, it's instantaneous!

## FAQ
### Who...who are you?
Come find us! We're always happy to discuss what you think could be improved about the web3 developer ecosystem [over on our Discord](https://discord.gg/DaDd4wNn6y).