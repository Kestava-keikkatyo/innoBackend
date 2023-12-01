/* eslint-disable no-unused-vars */
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { CloudStack } from "./cloud-stack";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { SecretValue } from "aws-cdk-lib";
import { HealthCheck } from "aws-cdk-lib/aws-appmesh";

type Props = {
  stack: CloudStack;
  vpc: ec2.IVpc;
  dbCluster?: cdk.aws_docdb.DatabaseCluster;
  dbCredentials?: secretsmanager.Secret;
};

export const createECS = ({ stack, vpc, dbCluster, dbCredentials }: Props) => {
  /*const ecsSG = new ec2.SecurityGroup(stack, "ecsSecurityGroup", {
    vpc,
    allowAllOutbound: true,
  });*/

  const cluster = new ecs.Cluster(stack, "ecsCluster", {
    vpc: vpc,
  });

  /*const taskPolicy = new iam.ManagedPolicy(stack, "ecsTaskPolicy", {
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "secretsmanager:CreateSecret",
          "secretsmanager:ListSecrets",
          "secretsmanager:GetSecretValue",
          "ssm:GetParameters",
          "kms:Decrypt",
        ],
        resources: ["*"],
      }),
    ],
  });

  const ecsTaskRole = new iam.Role(stack, "ecsTaskRole", {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
  });

  ecsTaskRole.addManagedPolicy(taskPolicy);*/

  const ecsExecRole = new iam.Role(stack, "ecsEcecutionRole", {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")],
  });

  /*const uri = new secretsmanager.Secret(stack, "databaseURI", {
    secretObjectValue: {
      uri: cdk.SecretValue.unsafePlainText(
        `mongodb://${ecs.Secret.fromSecretsManager(dbCredentials, "usrname")}:${ecs.Secret.fromSecretsManager(
          dbCredentials,
          "masterSecret"
        )}@${dbCluster.instanceEndpoints[0].hostname}:5432`
      ),
    },
  });*/

  const secrets = new secretsmanager.Secret(stack, "Secret", {
    secretObjectValue: {
      username: SecretValue.unsafePlainText(process.env.MONGODB_USER!),
      password: SecretValue.unsafePlainText(process.env.MONGODB_PASSWORD!),
      uri: SecretValue.unsafePlainText(process.env.MONGODB_URI!),
      db_first_admin_email: SecretValue.unsafePlainText(process.env.DB_FIRST_ADMIN_EMAIL!),
      db_first_admin_password: SecretValue.unsafePlainText(process.env.DB_FIRST_ADMIN_PASSWORD!),
    },
  });

  secrets.grantRead(ecsExecRole);

  const loadBalancedFargateService = new ApplicationLoadBalancedFargateService(stack, "Service", {
    cluster,
    memoryLimitMiB: 1024,
    desiredCount: 1,
    cpu: 512,
    taskImageOptions: {
      image: ecs.ContainerImage.fromRegistry("385316849301.dkr.ecr.eu-north-1.amazonaws.com/keikkakaveri:latest"),
      executionRole: ecsExecRole,
      //taskRole: ecsTaskRole,
      secrets: {
        MONGODB_USER: ecs.Secret.fromSecretsManager(secrets, "username"),
        MONGODB_PASSWORD: ecs.Secret.fromSecretsManager(secrets, "password"),
        MONGODB_URI: ecs.Secret.fromSecretsManager(secrets, "uri"),
        DB_FIRST_ADMIN_EMAIL: ecs.Secret.fromSecretsManager(secrets, "db_first_admin_email"),
        DB_FIRST_ADMIN_PASSWORD: ecs.Secret.fromSecretsManager(secrets, "db_first_admin_password"),
      },
      environment: { IP: "localhost", PORT: "80" },
    },
    loadBalancerName: "application-lb",
    taskSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
    assignPublicIp: true,
  });
  loadBalancedFargateService.targetGroup.configureHealthCheck({
    path: "/healthcheck",
  });
};
