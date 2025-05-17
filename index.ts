import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import { Storage } from "./modules/storage";
import { Aci } from "./modules/aci";

// Create an Azure Resource Group
const resourceGroupName = "minecraft";
const resourceGroup = new resources.ResourceGroup(resourceGroupName, {
  resourceGroupName,
});

const storage = new Storage("mc-storage", {
  resourceGroup,
  accountName: "mcstorage-hiro",
});

const serverPort = 8080;

const aci = new Aci("mc-server", {
  resourceGroup,
  containerGroupName: "mccontainers",
  dnsNameLabel: "nemui-santa",
  protocol: "TCP",
  hostPort: serverPort,
  serverContainerProps: {
    name: "server",
    image: "python:3.9-alpine",
    command: [
      `"sh", "-c", "python3 -m http.server ${serverPort} --bind 0.0.0.0"`,
    ],
    cpu: 0.5,
    memory: 0.5,
    environmentVariables: [],
  },
  watchdogsProps: {
    name: "sidecar",
    image: "python:3.9-alpine",
    command: [
      "sh",
      "-c",
      `
while true; do
  echo "[$(date)] Checking server...";
  curl -v http://web:${serverPort};
  sleep 60;
done
`,
    ],
    cpu: 0.1,
    memory: 0.1,

    environmentVariables: [],
  },
});
