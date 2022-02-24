import env from "@kosko/env";
import { ok } from "assert";
import { Deployment } from "kubernetes-models/apps/v1/Deployment";
import { azureProjectVolume } from "@socialgouv/kosko-charts/components/azure-storage/azureProjectVolume";
import environments from "@socialgouv/kosko-charts/environments";
import { create } from "@socialgouv/kosko-charts/components/app";
import {
  addEnvs,
  addInitContainerCommand,
} from "@socialgouv/kosko-charts/utils";
import { Volume, VolumeMount } from "kubernetes-models/v1";
import { loadFile } from "@kosko/yaml";

const tag = process.env.GITHUB_SHA;

export default async () => {
  const ciEnv = environments(process.env);
  const isDev = !(ciEnv.isPreProduction || ciEnv.isProduction);

  const [persistentVolumeClaim, persistentVolume] = azureProjectVolume(
    "files",
    {
      storage: "20Gi",
    }
  );

  const uploadsVolume = new Volume({
    name: "files",
    persistentVolumeClaim: { claimName: persistentVolumeClaim.metadata!.name! },
  });

  const uploadsVolumeMount = new VolumeMount({
    mountPath: "/mnt/files",
    name: "files",
  });

  const emptyDir = new Volume({ name: "files", emptyDir: {} });

  // declare our API deployment
  const manifests = (
    await create("api", {
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
        volumes: [isDev ? emptyDir : uploadsVolume],
        container: {
          volumeMounts: [uploadsVolumeMount],
          resources: {
            requests: {
              cpu: "250m",
              memory: "256Mi",
            },
            limits: {
              cpu: "1",
              memory: "1Gi",
            },
          },
        },
      },
    })
  ).concat(
    isDev
      ? []
      : [
          persistentVolumeClaim,
          persistentVolume,
          ...(await loadFile(
            `environments/${env.env}/azure-mano-volume.sealed-secret.yml`
          )()),
        ]
  );

  const getDeployment = (manifests: any[]) =>
    manifests.find((manifest) => manifest.kind === "Deployment") as Deployment;

  const deployment = getDeployment(manifests);
  ok(deployment);

  addEnvs({
    deployment,
    data: {
      STORAGE_DIRECTORY: "/mnt/files",
    },
  });

  // create an initContainer to init DB, only in dev (destructive)
  if (env.env === "dev") {
    const ciEnv = environments(process.env);

    addInitContainerCommand(deployment, {
      command: ["yarn"],
      args: ["initdb"],
      envFrom: [
        {
          secretRef: {
            name: `pg-user-${ciEnv.branchSlug}`,
          },
        },
      ],
    });
  }

  return manifests;
};
