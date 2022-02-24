//

import { getEnvManifests } from "@socialgouv/kosko-charts/testing";
import { project } from "@socialgouv/kosko-charts/testing/fake/github-actions.env";

jest.setTimeout(1000 * 60);
test("kosko generate --prod", async () => {
  process.env.HARBOR_PROJECT = "mano";
  expect(
    await getEnvManifests("prod", "", {
      ...project("mano").prod,
      RANCHER_PROJECT_ID: "c-5rj5b:p-hht9x",
    })
  ).toMatchSnapshot();
});
