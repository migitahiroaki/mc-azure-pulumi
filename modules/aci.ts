import * as resources from "@pulumi/azure-native/resources";
import * as pulumi from "@pulumi/pulumi";
import { ResourceProps } from "./interfaces/resourceProps";
import { containerinstance } from "@pulumi/azure-native";
import { Output } from "@pulumi/pulumi";

interface ContainerProps {
  readonly name: string;
  readonly image: string;
  readonly command?: string[];
  readonly cpu: number;
  readonly memory: number;
  readonly environmentVariables?: {
    name: string;
    value: string;
  }[];
}

export interface AciProps extends ResourceProps {
  readonly containerGroupName: string;
  readonly dnsNameLabel: string;
  readonly serverContainerProps: ContainerProps;
  readonly protocol: "TCP" | "UDP";
  readonly hostPort: number;
  readonly storageShareName: Output<string>;
  readonly storageAccountName: Output<string>;
  readonly storageAccountKey: Output<string>;
}

export class Aci extends pulumi.ComponentResource {
  public readonly containerGroup: containerinstance.ContainerGroup;
  private readonly resourceGroup: resources.ResourceGroup;

  constructor(
    name: string,
    props: AciProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:aci:ContainerInstance", name, { pretect: false }, opts);

    const DATA = "data";

    this.resourceGroup = props.resourceGroup;

    this.containerGroup = new containerinstance.ContainerGroup(
      props.containerGroupName,
      {
        resourceGroupName: this.resourceGroup.name,
        containerGroupName: props.containerGroupName,
        location: this.resourceGroup.location,
        osType: "Linux",
        restartPolicy: "Never",
        ipAddress: {
          type: "Public",
          ports: [
            {
              protocol: props.protocol,
              port: props.hostPort,
            },
          ],
          dnsNameLabel: props.dnsNameLabel,
        },
        containers: [
          {
            name: props.serverContainerProps.name,
            image: props.serverContainerProps.image,
            command: props.serverContainerProps.command,
            ports: [
              {
                // ホストポートと同じにする
                port: props.hostPort,
              },
            ],
            resources: {
              requests: {
                cpu: props.serverContainerProps.cpu,
                memoryInGB: props.serverContainerProps.memory,
              },
            },
            volumeMounts: [
              {
                name: DATA,
                mountPath: `/${DATA}`,
                readOnly: false,
              },
            ],
            environmentVariables:
              props.serverContainerProps.environmentVariables,
          },
        ],
        volumes: [
          {
            name: DATA,
            azureFile: {
              shareName: props.storageShareName,
              storageAccountName: props.storageAccountName,
              storageAccountKey: props.storageAccountKey,
            },
          },
        ],
      }
    );
  }
}
