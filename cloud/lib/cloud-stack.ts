/* eslint-disable no-unused-vars */
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { createVPC } from "./vpc";
import { createECS } from "./ecs";

export class CloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = createVPC(this);

    /*const { dbCredentials, dbCluster } = createCluster({
      stack: this,
      vpc,
    });*/

    createECS({
      stack: this,
      vpc,
    });

    //dbCluster.connections.allowFrom(ecsSG, Port.allTcp());
    //loadBalancedFargateService.service.connections.allowFrom(dbCluster, Port.allTcp());
  }
}
