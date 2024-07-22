import { useRecoilValue } from "recoil";
import { currentTeamAuthentifiedState, userAuthentifiedState } from "../recoil/auth";
import API, { tryFetchExpectOk } from "../services/api";
import { DONE, encryptAction, TODO } from "../recoil/actions";
import { usePreparePersonForEncryption } from "../recoil/persons";

const numberOfPersons = 10000;
const numberOfActionsPerPerson = 100;

export default function AddPersons() {
  const currentTeam = useRecoilValue(currentTeamAuthentifiedState);
  const user = useRecoilValue(userAuthentifiedState);
  const { encryptPerson } = usePreparePersonForEncryption();

  async function onClick() {
    for (let i = 0; i < numberOfPersons; i++) {
      if (i % 100 === 0) console.log(`Creating person ${i + 1} out of ${numberOfPersons}`);
      const [error, response] = await tryFetchExpectOk(async () =>
        API.post({
          path: "/person",
          body: await encryptPerson({
            name: Math.random().toString(36).substring(2, 12), // generate random 10 letters name
            teamId: currentTeam._id,
            // random date in the last 5 years
            followedSince: new Date(new Date().getTime() - Math.random() * 5 * 365 * 24 * 3600 * 1000),
            createdAt: new Date(new Date().getTime() - Math.random() * 5 * 365 * 24 * 3600 * 1000),
          }),
        })
      );
      if (!error) {
        const actions = [];
        for (let a = 0; a < numberOfActionsPerPerson; a++) {
          actions.push({
            name: Math.random().toString(36).substring(2, 12), // generate random 10 letters name
            person: response.data._id,
            teams: [currentTeam._id],
            user: user._id,
            dueAt: new Date(new Date().getTime() + Math.random() * 365 * 24 * 3600 * 1000), // random date in the next year
            withTime: Math.random() > 0.5,
            status: Math.random() > 0.5 ? TODO : DONE,
            description: Math.random().toString(36).substring(2, 12), // generate random 10 letters name
            categories: [],
            urgent: false,
          });
        }
        await API.post({
          path: "/action/multiple",
          body: await Promise.all(actions.map(encryptAction)),
        });
      }
    }
    alert(`${numberOfPersons} personnes et ${numberOfActionsPerPerson} actions par personne ont été créées`);
  }
  return (
    <button
      type="button"
      className="hover:tw-text-main hover:tw-underline tw-my-0.5 tw-block tw-rounded-lg tw-py-0.5 tw-text-sm tw-font-semibold tw-text-black75 tw-text-left"
      onClick={onClick}
    >
      Ajouter {numberOfPersons} personnes suivies
    </button>
  );
}
