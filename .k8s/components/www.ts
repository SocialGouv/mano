import env from "@kosko/env";
import { ok } from "assert";

import { create } from "@socialgouv/kosko-charts/components/nginx";
import { getHarborImagePath } from "@socialgouv/kosko-charts/utils";

const envConfig = {} as Record<string, any>

if (env.env==="prod") {
  envConfig.subdomain = "mano-app"
} else {
  envConfig.subDomainPrefix = "app-"
}

const manifests = create("www", {
  env,
  config: {
    containerPort: 80,
    image: getHarborImagePath({ name: "mano-www" }),
    ...envConfig
  },
  deployment: {
    // private registry need a registry secret
    imagePullSecrets: [{ name: "regcred" }],
  },
});

export default manifests;
