import * as ec2 from "aws-cdk-lib/aws-ec2";
import { CloudStack } from "./cloud-stack";

export const createVPC = (stack: CloudStack): ec2.Vpc => {
  const vpc = new ec2.Vpc(stack, "keikkakaveriVPC", {
    cidr: "10.30.0.0/16",
    maxAzs: 3,
    subnetConfiguration: [
      {
        name: "Public",
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      },
    ],
  });

  return vpc;
};
