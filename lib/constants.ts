export const CONFIG_NAME = ".quikdrawconfig";
export const INIT_CMD = "init";
export const GO_CMD = "go";
export const DEPLOY_CMD = "deploy";
export const UPLOAD_CMD = "upload";
export const HELP_CMD = "help";

export const HOST = "localhost:3000";
export const INGEST_URL = "http://localhost:8080/api/ingestQuikdraw";
//export const HOST = "kontour.io";
//export const INGEST_URL = "https://api.kontour.io/api/ingestQuikdraw";
export const HELP_URL = "https://discord.gg/DaDd4wNn6y";
export const VERSION_HOST = "https://kontour.io/versions";
export const INSTANCE_HOST = "https://kontour.io/instances";

export const GO_URL_REGEX = new RegExp(
  `(https?:\/\/)?${HOST}\/(projects|versions)\/([a-zA-Z0-9\-\_]+)`
);
