import fetch from "node-fetch";
import { INGEST_URL, INSTANCE_HOST } from "./constants";
import { ConfigData } from "./types";

export async function migrate(
  contractName: string,
  data: ConfigData,
  args: any[]
): Promise<any> {
  const { apiKey, projectId, versionId } = data;
  console.log(`Deploying ${contractName}`);
  const resp = await fetch(`${INGEST_URL}/migrate`, {
    method: "POST",
    body: JSON.stringify({
      apiKey: apiKey,
      projectId: projectId,
      versionId: versionId,
      contractName: contractName,
      args: args,
    }),
    headers: { "Content-Type": "application/json" },
  });
  const { id, address, node_id, params, instance_id } = await resp.json();
  console.log(`${contractName} was deployed at ${address}!`);
  console.log(`Check out ${INSTANCE_HOST}/${instance_id}`);
}
