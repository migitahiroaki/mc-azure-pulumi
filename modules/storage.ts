import * as storage from "@pulumi/azure-native/storage";
import * as resources from "@pulumi/azure-native/resources";
import * as pulumi from "@pulumi/pulumi";
import { ResourceProps } from "./interfaces/resourceProps";

export interface StorageProps extends ResourceProps {
  accountName: string;
  sku?: storage.SkuName;
  kind?: storage.Kind;
}

export class Storage extends pulumi.ComponentResource {
  private readonly resourceGroup: resources.ResourceGroup;
  public readonly storageAccount: storage.StorageAccount;
  public readonly storageAccountKey: pulumi.Output<string>;
  public readonly fileShare: storage.FileShare;

  constructor(
    name: string,
    props: StorageProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:storage:StorageAccount", name, { pretect: false }, opts);

    this.resourceGroup = props.resourceGroup;

    const storageAccount = new storage.StorageAccount(
      props.accountName,
      {
        accountName: props.accountName,
        resourceGroupName: props.resourceGroup.name,
        sku: {
          name: props.sku || storage.SkuName.Standard_LRS,
        },
        kind: props.kind || storage.Kind.StorageV2,
      },
      { parent: this }
    );

    const storageAccountPrimaryKey = storage.listStorageAccountKeysOutput({
      resourceGroupName: props.resourceGroup.name,
      accountName: storageAccount.name,
    }).keys[0].value;

    const fileShare = new storage.FileShare(
      `share-${props.accountName}`,
      {
        resourceGroupName: this.resourceGroup.name,
        accountName: storageAccount.name,
        shareQuota: 10,
      },
      { parent: this }
    );

    this.storageAccount = storageAccount;
    this.storageAccountKey = storageAccountPrimaryKey;
    this.fileShare = fileShare;

    this.registerOutputs({
      storageAccount,
      storageAccountKey: storageAccountPrimaryKey,
      fileShare,
    });
  }
}
