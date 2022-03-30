import fs from "fs";
import path from "path";
import {
  HELP_URL,
  CONFIG_NAME,
  INIT_CMD,
  GO_CMD,
  VERSION_HOST,
  DEPLOY_CMD,
  HELP_CMD,
  GO_URL_REGEX,
} from "./lib/constants";
import { askQuestion, configSearch } from "./lib/helpers";
import { ConfigData } from "./lib/types";
import { endSession, projectIdLookup } from "./lib/uploader";

const configFile = configSearch();
const currDir = process.cwd();

const getConfig = (): ConfigData => {
  if (!configFile) {
    console.log("Looks like you haven't run init yet");
    process.exit(0);
  }
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
      "Sorry, you've gotta have an API key to use Kontour - visit https://kontour.io/alpha to get one for free!"
    );
    process.exit(0);
  }
  return data;
};

export const Commands = {
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
        truffleConfig =
          (await askQuestion(
            `\nLocation of your truffle-config.js [./truffle-config.js]: `
          )) || "./truffle-config.js";
        break;
      case "2":
        type = "hardhat";
        break;
      default:
        console.log(
          `Kontour currently only supports hardhat or truffle users - we'd love to hear about any additional feature requests!`
        );
        console.log(
          `\nCome visit our team at ${HELP_URL} and we'll get you all set up!`
        );
        process.exit(0);
    }

    const apiKey = await askQuestion(
      "\nGrab your API key from https://kontour.io/alpha (required!): "
    );
    const projectId = await askQuestion("\nDefault projectId [null]: ");

    const data: ConfigData = {
      type: type,
      truffleConfigPath: truffleConfig || "",
      apiKey,
      projectId,
      versionId: "",
    };
    fs.writeFileSync(toWritePath, JSON.stringify(data, null, 2));

    console.log(`Successfully created ${toWritePath}`);
    process.exit(0);
  },
  go: async (maybeArgs) => {
    if (!configFile) {
      console.log("Looks like you haven't run init yet");
      process.exit(0);
    }
    const data = getConfig();
    if (maybeArgs.length > 0) {
      const match = maybeArgs[0].match(GO_URL_REGEX);
      if (!match) {
        console.log(
          "quikdraw go [url] must be in the form of kontour.io/[projects|versions]/:id"
        );
        process.exit(0);
      }
      switch (
        match[2] // projects | versions
      ) {
        case "projects":
          const projectId = match[3]; // the id
          data.projectId = projectId;
          data.versionId = null;
          break;
        case "versions":
          const versionId = match[3]; // the id
          const resp = await projectIdLookup(versionId, data.apiKey);
          data.projectId = resp.id;
          data.versionId = versionId;
          break;
      }
    }
    if (!data.projectId) {
      const ans = await askQuestion(
        "\nNo projectId found in .quikdrawconfig, this run will create a new project [Y/n]: "
      );
      if (ans.toLowerCase() === "n") {
        console.log(
          "Replace your projectId in .quikdrawconfig or use `go kontour.io/projects/{id}`"
        );
        process.exit(0);
      }
    }
    if (!data.versionId) {
      const ans = await askQuestion(
        "\nNo versionId found in .quikdrawconfig, this run will create a new version [Y/n]: "
      );
      if (ans.toLowerCase() === "n") {
        console.log(
          "Replace your versionId in .quikdrawconfig or use `go kontour.io/versions/{id}`"
        );
        process.exit(0);
      }
    }
    const { uploadPaths, startSession } = require("./lib/uploader");

    let fqPath, compiledContractPaths;
    if (data.type === "truffle") {
      const truffle = require("truffle");
      const truffleConfig = require(path.resolve(
        currDir,
        data.truffleConfigPath
      ));
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

    const { projectId, versionId } = await startSession(data);
    const { uploadedNames } = await uploadPaths(
      compiledContractPaths,
      projectId,
      versionId,
      data.apiKey
    );
    await endSession(projectId, versionId, data.apiKey);
    console.log(`Find your project at ${VERSION_HOST}/${versionId}`);
    data.projectId = projectId;
    data.versionId = versionId;
    fs.writeFileSync(configFile, JSON.stringify(data));
    process.exit(0);
  },
  deploy: async () => {
    const data = getConfig();
    const deployScript = path.resolve(currDir, data.deploy!);
    require(deployScript);
    process.exit(0);
  },
  help: async () => {
    console.log(
      "quikdraw help: see https://www.npmjs.com/package/quikdraw for detailed documentation.\n"
    );
    console.log(
      "quikdraw init: creates a new .quikdrawconfig if none exists\n"
    );
    console.log(
      "quikdraw go [url]: given an optional url in the form kontour.io/[projects|versions]/id, compiles contracts and deploys to the Kontour instance in .quikdrawconfig\n"
    );
    console.log(
      "quikdraw deploy: if a 'deploy' field exists in .quikdrawconfig, runs the script"
    );
  },
};

export async function Runner() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case INIT_CMD:
      await Commands.init();
    case GO_CMD:
      await Commands.go(rest);
    case DEPLOY_CMD:
      await Commands.deploy();
    case HELP_CMD:
      await Commands.help();
  }
}

export async function migrate(
  contractName: string,
  args: any[]
): Promise<string> {
  const migrator = require("./lib/migrator");
  const data = getConfig();

  return await migrator.migrate(contractName, data, args);
}
