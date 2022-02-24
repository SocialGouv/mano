//

import { getEnvManifests } from "@socialgouv/kosko-charts/testing";
import { project } from "@socialgouv/kosko-charts/testing/fake/github-actions.env";

jest.setTimeout(1000 * 60);
test("kosko generate --dev", async () => {
  process.env.HARBOR_PROJECT = "mano";
  expect(
    await getEnvManifests("dev", "", {
      ...project("mano").dev,
      KUBE_NAMESPACE: "mano-186-master-dev2",
      //RANCHER_PROJECT_ID: "c-bd7z2:p-dtlsm",
    })
  ).toMatchSnapshot();
});
