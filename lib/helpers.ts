import readline from "readline";
import fs from "fs";
import path from "path";
import { CONFIG_NAME } from "./constants";

export function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

export function configSearch(): string | null {
  let currPath = process.cwd();
  let lastSeen = null;
  while (currPath != "/" && lastSeen !== currPath) {
    lastSeen = currPath;
    if (fs.readdirSync(currPath).indexOf(CONFIG_NAME) !== -1) {
      return `${currPath}/${CONFIG_NAME}`;
    }
    currPath = path.resolve(currPath, "..");
  }
  return null;
}
