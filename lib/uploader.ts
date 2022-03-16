import fetch from "node-fetch";
import pLimit from "p-limit";
import fs from "fs";
import FormData from "form-data";
import { INGEST_URL } from "./constants";
import { ConfigData } from "./types";

const limit = pLimit(4);

export async function startSession(data: ConfigData): Promise<{
  projectId: string;
  versionId: string;
}> {
  const resp = await fetch(`${INGEST_URL}/start`, {
    method: "POST",
    body: JSON.stringify({
      apiKey: data.apiKey,
      projectId: data.projectId || null,
      versionId: data.versionId || null,
    }),
    headers: { "Content-Type": "application/json" },
  });
  return await resp.json();
}

export async function endSession(
  projectId: string,
  versionId: string,
  apiKey: string
) {
  await fetch(`${INGEST_URL}/end`, {
    method: "POST",
    body: JSON.stringify({
      apiKey: apiKey,
      projectId: projectId,
      versionId: versionId,
    }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function uploadPaths(
  pathsToUpload: string[],
  projectId: string,
  versionId: string,
  apiKey: string
): Promise<{ uploadedNames: string[] }> {
  console.log(`\nUploading to project ${projectId}, version ${versionId}`);

  const uploadedNames = [];
  await Promise.all(
    pathsToUpload.map((contractPath) => {
      return limit(async () => {
        let readBuffer = fs.readFileSync(contractPath);
        const contract = JSON.parse(readBuffer.toString());
        if (
          contract.bytecode.length == 0 ||
          contract.abi.length === 0 ||
          contract.bytecode === "0x"
        ) {
          console.log(`Skipping ${contract.contractName}`);
          return;
        }

        console.log(`Uploading ${contract.contractName}`);
        const form = new FormData();
        form.append("file", readBuffer, "file.json");
        form.append("apiKey", apiKey);
        form.append("projectId", projectId);
        form.append("versionId", versionId);
        await fetch(INGEST_URL, {
          method: "POST",
          body: form,
          headers: { ...form.getHeaders() },
        });
        console.log(`Uploaded ${contract.contractName}`);
        uploadedNames.push(contract.contractName);
      });
    })
  );

  return {
    uploadedNames: uploadedNames,
  };
}
