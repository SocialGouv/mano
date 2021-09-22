import env from "@kosko/env";

import { create } from "@socialgouv/kosko-charts/components/metabase";

const manifests = create("metabase", {
  env,
});

export default manifests;
