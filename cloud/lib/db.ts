import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { CloudStack } from "./cloud-stack";
import { DatabaseCluster, DatabaseSecret } from "aws-cdk-lib/aws-docdb";

type Props = {
  stack: CloudStack;
  vpc: ec2.IVpc;
};

type ReturnType = {
  dbCredentials: secretsmanager.Secret;
  dbCluster: cdk.aws_docdb.DatabaseCluster;
};

export const createCluster = ({ stack, vpc }: Props): ReturnType => {
  const dbSG = new ec2.SecurityGroup(stack, "rdsSecutityGroup", {
    vpc,
    allowAllOutbound: true,
  });

  dbSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432));

  const dbCluster = new DatabaseCluster(stack, "Database", {
    vpc,
    vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    masterUser: {
      username: "devailija",
      excludeCharacters: '"@/:', // optional, defaults to the set "\"@/" and is also used for eventually created rotations
    },
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.MEMORY5, ec2.InstanceSize.LARGE),
    securityGroup: dbSG,
    port: 5432,
  });

  const dbCredentials = new DatabaseSecret(stack, "dbCredentials", {
    username: "devailija",
    masterSecret: dbCluster.secret,
  });
  dbCredentials.attach(dbCluster);

  return { dbCredentials, dbCluster };
};
