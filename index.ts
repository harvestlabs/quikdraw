import truffle from "truffle";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import pLimit from "p-limit";
import { CONFIG_NAME, INIT_CMD, GO_CMD, INGEST_URL } from "./lib/constants";
import { askQuestion, configSearch } from "./lib/helpers";
import { ConfigData } from "./lib/types";

const limit = pLimit(4);
const configFile = configSearch();
const currDir = process.cwd();

const Commands = {
  init: async () => {
    let toWritePath = configFile;
    if (toWritePath) {
      const answer = await askQuestion(
        `Found an existing config at ${toWritePath}, do you want to replace it? [y/N]: `
      );
      if (!(answer === "y" || answer === "Y")) {
        process.exit(0);
      }
    } else {
      toWritePath = `${currDir}/${CONFIG_NAME}`;
      console.log(`Writing new config at ${toWritePath}`);
    }
    const defaultTruffle = `${currDir}/truffle.config.js`;
    let truffleConfig = await askQuestion(
      `\nLocation of your truffle.config.js [${defaultTruffle}]: `
    );
    if (truffleConfig && !path.isAbsolute(truffleConfig)) {
      truffleConfig = path.join(currDir, truffleConfig);
    }
    const apiKey = await askQuestion(
      "\nGrab your API key from https://kontour.io/key (required!): "
    );
    const projectId = await askQuestion("\nDefault projectId [null]: ");
    const contracts = await askQuestion(
      "\nComma-separated list of contracts to upload to Kontour [*]: "
    );

    const data: ConfigData = {
      truffleConfigPath: truffleConfig || defaultTruffle,
      apiKey,
      projectId,
      contracts: contracts || "*",
    };
    fs.writeFileSync(toWritePath, JSON.stringify(data));

    console.log(`Successfully created ${toWritePath}`);
    process.exit(0);
  },
  go: async () => {
    // contracts_directory: String. Directory where .sol files can be found.
    // contracts_build_directory: String. Directory where .sol.js files can be found and written to.
    // all: Boolean. Compile all sources found. Defaults to true. If false, will compare sources against built files
    //      in the build directory to see what needs to be compiled.
    // network_id: network id to link saved contract artifacts.
    // quiet: Boolean. Suppress output. Defaults to false.
    // strict: Boolean. Return compiler warnings as errors. Defaults to false.
    try {
      fs.statSync(configFile);
    } catch (e) {
      console.log(
        `${CONFIG_NAME} doesn't exist - have you run 'quikdraw init'?\n`
      );
    }
    const data: ConfigData = JSON.parse(fs.readFileSync(configFile).toString());
    if (!data.apiKey || data.apiKey.length === 0) {
      console.log(
        "Sorry, you've gotta have an API key to use Kontour - visit https://kontour.io/key to get one for free!"
      );
      process.exit(0);
    }
    const truffleConfig = require(data.truffleConfigPath);
    await truffle.contracts.compile(truffleConfig);
    console.log("\nUploading compiled sources to Kontour now...");

    let fqPath = truffleConfig.contracts_build_directory;
    fqPath = path.resolve(currDir, truffleConfig.contracts_build_directory);
    const compiledContracts = fs.readdirSync(fqPath);
    const filterContractNames = data.contracts
      .split(",")
      .map((n) => new RegExp(n));
    await Promise.all(
      compiledContracts.map(async (c) => {
        return limit(async () => {
          const contractPath = path.join(fqPath, c);
          let readBuffer = fs.readFileSync(contractPath);

          const contract = JSON.parse(readBuffer.toString());
          const matches = filterContractNames.find((r) =>
            contract.contractName.match(r)
          );
          if (!matches) {
            return;
          }

          console.log(`Uploading ${c}`);
          const form = new FormData();
          form.append("file", readBuffer, "file.json");
          form.append("apiKey", data.apiKey);
          await fetch(INGEST_URL, {
            method: "POST",
            body: form,
            headers: { ...form.getHeaders() },
          });
          console.log(`Uploaded ${c}`);
        });
      })
    );
    process.exit(0);
  },
};

async function Runner() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case INIT_CMD:
      await Commands.init();
    case GO_CMD:
      await Commands.go();
  }
}

Runner();
