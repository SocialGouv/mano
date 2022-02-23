//

import { getEnvManifests } from "@socialgouv/kosko-charts/testing";
import { project } from "@socialgouv/kosko-charts/testing/fake/gitlab-ci.env";

jest.setTimeout(1000 * 60);
test("kosko generate --preprod", async () => {
  process.env.HARBOR_PROJECT = "mano";
  expect(
    await getEnvManifests("preprod", "", {
      ...project("mano").preprod,
      KUBE_NAMESPACE: "mano-186-preprod-dev2",
      // RANCHER_PROJECT_ID: "c-bd7z2:p-dtlsm",
    })
  ).toMatchSnapshot();
});
