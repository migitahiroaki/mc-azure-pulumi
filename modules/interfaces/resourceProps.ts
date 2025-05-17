import * as resources from "@pulumi/azure-native/resources";

export interface ResourceProps {
  resourceGroup: resources.ResourceGroup;
}