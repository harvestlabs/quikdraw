# Quikdraw
### A CLI sidekick to [Kontour](https://kontour.io), the superpowered web3 private testnet.


## Getting started
1. Install Quikdraw globally
   ```
   npm install -g quikdraw
   ```
2. Navigate to your smart contract repo. This is normally the path where you've installed Truffle or Hardhat.
3. Initialize Quikdraw by answering a few simple questions (this example is for a Truffle repo)
    ```
    quikdraw init
    ```
4. Write some <b>awesome awesome contract code</b>
5. You're ready to test your contracts and your client dev teammate is waiting for you to deploy to a shared testnet. Have no fear, you don't need to go to a faucet or upload those pesky ABIs anywhere! Just run
   ```
   quikdraw go
   ```
6. Your contracts will be deployed to a new project, as a new draft version. We'll give you a handy Kontour link and save these settings for the next time around.
7. Enjoy using Kontour to browse your private test node and share a one-click SDK url to your teammates! Whenever you want to deploy a new round of contracts, just `quikdraw go` and your team will automatically be up to date, with <b>zero address sharing, zero ABIs, zero test tokens, and zero client changes necessary!</b>

## Details
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

Find your project at https://kontour.io/projects/36142e64-2367-42fc-b996-54ab0600a602/bd47e6e7-1311-4a7c-8137-f80361c6d2ee
Do you want to update your current project settings to this draft? [Y/n]: Y
```
Under the hood, Quikdraw triggers your project's Truffle or Hardhat compilation. It then takes those compiled artifacts and sends them to your private Kontour project, which makes them available to add to your node. Whenever you make changes and compile a new set of contracts, your Kontour draft will update to those new versions.

Client developers can point to any version of your smart contract APIs that they want by changing a single URL parameter, and Kontour will make sure all of the web3.js SDKs are automatically generated and kept up to date! 

## FAQ
### Who...who are you?
Come find us! We're always happy to discuss what you think could be improved about the web3 developer ecosystem [over on our Discord](https://discord.gg/DaDd4wNn6y).