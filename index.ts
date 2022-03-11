import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import pLimit from "p-limit";
import {
  HELP_URL,
  CONFIG_NAME,
  INIT_CMD,
  GO_CMD,
  INGEST_URL,
} from "./lib/constants";
import { askQuestion, configSearch } from "./lib/helpers";
import { ConfigData } from "./lib/types";

const limit = pLimit(4);
const configFile = configSearch();
const currDir = process.cwd();
const IS_WIN = process.platform === "win32";

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
    let selection = await askQuestion(
      `\nAre you using truffle or hardhat to manage your environment?
(1) truffle
(2) hardhat
(3) I'm not sure how to get started, help me out? [default - 3]: `
    );
    let truffleConfig, type;
    switch (selection) {
      case "1":
        type = "truffle";
        truffleConfig = await askQuestion(
          `\nLocation of your truffle-config.js [./truffle-config.js]: `
        );
        if (truffleConfig && !path.isAbsolute(truffleConfig)) {
          truffleConfig = path.join(currDir, truffleConfig);
        }
        break;
      case "2":
        type = "hardhat";
        break;
      default:
        console.log(
          `\nKontour currently only supports hardhat or truffle users - we'd love to hear about any additional feature requests!
Come visit our team at ${HELP_URL} and we'll get you all set up!`
        );
        process.exit(0);
    }

    const apiKey = await askQuestion(
      "\nGrab your API key from https://kontour.io/key (required!): "
    );
    const projectId = await askQuestion("\nDefault projectId [null]: ");
    const contracts = await askQuestion(
      "\nComma-separated list of contracts to upload to Kontour [.*]: "
    );

    const data: ConfigData = {
      type: type,
      truffleConfigPath: truffleConfig || "",
      apiKey,
      projectId,
      contracts: contracts || ".*",
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
      process.exit(0);
    }
    const data: ConfigData = JSON.parse(fs.readFileSync(configFile).toString());
    if (!data.apiKey || data.apiKey.length === 0) {
      console.log(
        "Sorry, you've gotta have an API key to use Kontour - visit https://kontour.io/key to get one for free!"
      );
      process.exit(0);
    }
    let fqPath, compiledContractPaths;
    if (data.type === "truffle") {
      const truffle = require("truffle");
      const truffleConfig = require(data.truffleConfigPath);
      await truffle.contracts.compile(truffleConfig);
      fqPath = truffleConfig.contracts_build_directory;
      fqPath = path.resolve(currDir, truffleConfig.contracts_build_directory);
      compiledContractPaths = fs
        .readdirSync(fqPath)
        .map((c) => path.join(fqPath, c));
    } else if (data.type === "hardhat") {
      const hre = require("hardhat");
      await hre.run("compile");
      const artifacts = hre.config.paths.artifacts;
      const sourcesPath = path.relative(currDir, hre.config.paths.sources);
      const parentPath = path.resolve(
        currDir,
        path.join(artifacts, sourcesPath)
      );

      const contracts = fs.readdirSync(parentPath);
      compiledContractPaths = [];
      contracts.forEach((contractPath) => {
        const fullPath = path.join(parentPath, contractPath);
        const jsonFile = fs.readdirSync(fullPath).filter((filename) => {
          const parts = filename.split(".");
          return parts.indexOf("dbg") !== parts.length - 2;
        })[0];
        compiledContractPaths.push(path.resolve(fullPath, jsonFile));
      });
    } else {
      console.log(".quikdrawconfig had a type that was unknown");
      process.exit(0);
    }
    console.log("\nUploading compiled sources to Kontour now...");

    const filterContractNames = data.contracts
      .split(",")
      .map((n) => new RegExp(n.trim()));
    await Promise.all(
      compiledContractPaths.map(async (contractPath) => {
        return limit(async () => {
          let readBuffer = fs.readFileSync(contractPath);

          const contract = JSON.parse(readBuffer.toString());
          const matches = filterContractNames.find((r) =>
            contract.contractName.match(r)
          );
          if (!matches) {
            return;
          }

          console.log(`Uploading ${contract.contractName}`);
          const form = new FormData();
          form.append("file", readBuffer, "file.json");
          form.append("apiKey", data.apiKey);
          await fetch(INGEST_URL, {
            method: "POST",
            body: form,
            headers: { ...form.getHeaders() },
          });
          console.log(`Uploaded ${contract.contractName}`);
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
