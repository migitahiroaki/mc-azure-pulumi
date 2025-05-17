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
  accountName: "mcstorage01hiro",
});

const serverPort = 25565;
const serverName = "nemui-santa";

const aci = new Aci("mc-server", {
  resourceGroup,
  containerGroupName: "mccontainers",
  dnsNameLabel: serverName,
  protocol: "TCP",
  hostPort: serverPort,
  storageAccountName: storage.storageAccount.name,
  storageAccountKey: storage.storageAccountKey,
  storageShareName: storage.fileShare.name,
  serverContainerProps: {
    name: "minecraft",
    image: "itzg/minecraft-server",
    cpu: 1,
    memory: 2,
    environmentVariables: [
      {
        name: "EULA",
        value: "TRUE",
      },
      {
        name: "DIFFICULTY",
        value: "normal",
      },
      {
        name: "GAMEMODE",
        value: "survival",
      },
      {
        name: "SERVER_NAME",
        value: serverName,
      },
      {
        name: "LEVEL_SEED",
        value: "114514",
      },
      {
        name: "PLAYER_IDLE_TIMEOUT",
        value: "5",
      },
      {
        name: "SERVER_PORT",
        value: String(serverPort),
      },
    ],
  },
});
