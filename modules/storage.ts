import * as storage from "@pulumi/azure-native/storage";
import * as resources from "@pulumi/azure-native/resources";
import * as pulumi from "@pulumi/pulumi";
import {ResourceProps} from "./interfaces/resourceProps"

export interface StorageProps extends ResourceProps{
  accountName: string;
  sku?: storage.SkuName;
  kind?: storage.Kind;
}

export class Storage extends pulumi.ComponentResource {
  public readonly storageAccount: storage.StorageAccount;
  public readonly primaryStorageKey: pulumi.Output<string>;
  private readonly resourceGroup: resources.ResourceGroup;
  private readonly accountName: string;

  constructor(
    name: string,
    props: StorageProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:storage:StorageAccount", name, { pretect: false }, opts);

    this.resourceGroup = props.resourceGroup;
    this.accountName = props.accountName;

    this.storageAccount = new storage.StorageAccount(
      props.accountName,
      {
        accountName: this.accountName,
        resourceGroupName: props.resourceGroup.name,
        sku: {
          name: props.sku || storage.SkuName.Standard_LRS,
        },
        kind: props.kind || storage.Kind.StorageV2,
      },
      { parent: this }
    );

    // Get Storage Account Keys
    const storageAccountKeys = storage.listStorageAccountKeysOutput({
      resourceGroupName: props.resourceGroup.name,
      accountName: this.storageAccount.name,
    });

    this.primaryStorageKey = storageAccountKeys.keys[0].value;

    this.registerOutputs({
      storageAccount: this.storageAccount,
      primaryStorageKey: this.primaryStorageKey,
    });
  }

  public createFileShare(
    name: string,
    quotaInGB: number = 1
  ): storage.FileShare {
    return new storage.FileShare(
      name,
      {
        resourceGroupName: this.resourceGroup.name,
        accountName: this.storageAccount.name,
        shareQuota: quotaInGB,
      },
      { parent: this }
    );
  }
}
