import env from "@kosko/env";
import { ok } from "assert";

import { Deployment } from "kubernetes-models/apps/v1/Deployment";

import { create } from "@socialgouv/kosko-charts/components/app";
import { addInitContainerCommand } from "@socialgouv/kosko-charts/utils";

const tag = process.env.GITHUB_SHA;

export default async () => {
  // declare our API deployment
  const manifests = await create("api", {
    env,
    config: {
      containerPort: 3000,
      // will get appropriate PG secret
      withPostgres: true,
      image: `ghcr.io/socialgouv/mano/api:sha-${tag}`,
    },
    deployment: {
      // private registry need a registry secret
      imagePullSecrets: [{ name: "regcred" }],
      container: {
        resources: {
          requests: {
            cpu: "100m",
            memory: "128Mi",
          },
          limits: {
            cpu: "500m",
            memory: "512Mi",
          },
        },
      },
    },
  });

  const getDeployment = (manifests: any[]) =>
    manifests.find((manifest) => manifest.kind === "Deployment") as Deployment;

  // create an initContainer to init DB, only in dev (destructive)
  if (env.env === "dev") {
    const deployment = getDeployment(manifests);
    ok(deployment);

    addInitContainerCommand(deployment, {
      command: ["yarn"],
      args: ["initdb"],
      envFrom: [
        {
          secretRef: {
            name: `azure-pg-user-${process.env.CI_COMMIT_SHORT_SHA}`,
          },
        },
      ],
    });
  }

  return manifests;
};
