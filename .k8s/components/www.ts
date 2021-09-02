import env from "@kosko/env";

import { create } from "@socialgouv/kosko-charts/components/nginx";

const envConfig = {} as Record<string, any>;

if (env.env === "prod") {
  envConfig.subdomain = "mano-app";
} else {
  envConfig.subDomainPrefix = "app-";
}
const tag = process.env.GITHUB_SHA;

const manifests = create("www", {
  env,
  config: {
    containerPort: 80,
    image: `ghcr.io/socialgouv/mano/website:sha-${tag}`,
    ...envConfig,
  },
  deployment: {
    // private registry need a registry secret
    imagePullSecrets: [{ name: "regcred" }],
  },
});

export default manifests;
