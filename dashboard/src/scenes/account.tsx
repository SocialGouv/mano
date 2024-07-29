import React, { useRef, useState } from "react";
import { Formik } from "formik";
import { toast } from "react-toastify";
import { useRecoilState } from "recoil";
import Loading from "../components/loading";
import ChangePassword from "../components/ChangePassword";
import { userState } from "../recoil/auth";
import API, { tryFetch, tryFetchExpectOk } from "../services/api";
import { ModalBody, ModalContainer, ModalHeader, ModalFooter } from "../components/tailwind/Modal";
import DeleteButtonAndConfirmModal from "../components/DeleteButtonAndConfirmModal";
import { errorMessage } from "../utils";
import { capture } from "../services/sentry";

const Account = () => {
  const [user, setUser] = useRecoilState(userState);

  if (!user) return <Loading />;

  return (
    <>
      <h1 className="tw-text-xl tw-my-8 tw-font-normal">
        Mon compte: <strong>{user.name}</strong>
      </h1>
      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Informations</h3>
      <Formik
        initialValues={user}
        onSubmit={async (body) => {
          const [error] = await tryFetch(async () => API.put({ path: "/user", body }));
          if (!error) {
            toast.success("Mis à jour !");
            const [error, response] = await tryFetchExpectOk(async () => API.get({ path: "/user/me" }));
            if (error) {
              toast.error(errorMessage(error));
              return;
            }
            setUser(response.user);
          } else {
            toast.error(errorMessage(error));
          }
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <React.Fragment>
            <div className="tw-flex tw-flex-row tw-flex-wrap">
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <div className="tw-mb-4">
                  <label htmlFor="orgName">Nom</label>
                  <input
                    className="tailwindui"
                    autoComplete="off"
                    type="text"
                    name="name"
                    id="name"
                    value={values.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <div className="tw-mb-4">
                  <label htmlFor="email">Email</label>
                  <input
                    className="tailwindui"
                    autoComplete="off"
                    type="email"
                    name="email"
                    id="email"
                    value={values.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="tw-flex tw-justify-end tw-items-center">
              <button type="button" className="button-submit" disabled={isSubmitting} onClick={() => handleSubmit()}>
                Mettre à jour
              </button>
            </div>
          </React.Fragment>
        )}
      </Formik>
      <hr />
      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Actions</h3>
      <ul className="tw-flex tw-flex-col tw-gap-y-2 tw-px-4 tw-list-disc tw-list-inside">
        <li>
          <LinkToChangePassword />
        </li>
        <li>
          <DeleteButtonAndConfirmModal
            buttonText="Supprimer mon compte"
            className="hover:!tw-bg-red-200 !tw-bg-transparent !tw-shadow-none"
            title={`Voulez-vous vraiment supprimer l'utilisateur ${user.name}`}
            textToConfirm={user.email}
            roles={["admin", "superadmin", "normal", "restricted-access", "stats-only"]}
            onConfirm={async () => {
              const [error] = await tryFetch(async () => API.delete({ path: "/user/me" }));
              if (error) return;
              toast.success("Suppression réussie");
              window.location.reload();
            }}
          >
            <span className="tw-mb-7 tw-block tw-w-full tw-text-center">Cette opération est irréversible</span>
          </DeleteButtonAndConfirmModal>
        </li>
        <li>
          <TestConnexion />
        </li>
      </ul>
    </>
  );
};

const LinkToChangePassword = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="button-classic !tw-shadow-none tw-border-none tw-w-full tw-text-left tw-pl-4" onClick={() => setOpen(true)}>
        Modifier mon mot de passe
      </button>

      <ModalContainer open={open} onClose={() => setOpen(false)} className="change-password" size="3xl">
        <ModalHeader title="Modifier mon mot de passe" onClose={() => setOpen(false)} />
        <ModalBody className="tw-px-4 tw-py-2">
          <ChangePassword
            onSubmit={async (body: any) => {
              const [error, response] = await tryFetch(async () => API.post({ path: `/user/reset_password`, body }));
              if (error) {
                toast.error(errorMessage(error));
              }
              return response;
            }}
            onFinished={() => setOpen(false)}
            withCurrentPassword
          />
        </ModalBody>
      </ModalContainer>
    </>
  );
};

const TestConnexion = () => {
  const [open, setOpen] = useState(false);
  const [testLaunched, setTestLaunched] = useState(false);
  const [testOneCallEvery2Seconds, setTestOneCallEvery2Seconds] = useState<"done" | "ongoing" | "not-started">("not-started");
  const [testOneCallEvery1Seconds, setTestOneCallEvery1Seconds] = useState<"done" | "ongoing" | "not-started">("not-started");
  const [testOneCallEvery500MS, setTestOneCallEvery500MS] = useState<"done" | "ongoing" | "not-started">("not-started");
  const [testOneCallEvery200MS, setTestOneCallEvery200MS] = useState<"done" | "ongoing" | "not-started">("not-started");
  const [testOneCallEvery100MS, setTestOneCallEvery100MS] = useState<"done" | "ongoing" | "not-started">("not-started");
  const [testOneCallEvery50MS, setTestOneCallEvery50MS] = useState<"done" | "ongoing" | "not-started">("not-started");

  const responses = useRef([]);

  async function launchTest() {
    setTestLaunched(true);
    responses.current = [];
    setTestOneCallEvery2Seconds("ongoing");
    responses.current.push(...(await testEvery(2000, 5)));
    setTestOneCallEvery2Seconds("done");
    setTestOneCallEvery1Seconds("ongoing");
    responses.current.push(...(await testEvery(1000, 10)));
    setTestOneCallEvery1Seconds("done");
    setTestOneCallEvery500MS("ongoing");
    responses.current.push(...(await testEvery(500, 20)));
    setTestOneCallEvery500MS("done");
    setTestOneCallEvery200MS("ongoing");
    responses.current.push(...(await testEvery(200, 50)));
    setTestOneCallEvery200MS("done");
    setTestOneCallEvery100MS("ongoing");
    responses.current.push(...(await testEvery(100, 100)));
    setTestOneCallEvery100MS("done");
    setTestOneCallEvery50MS("ongoing");
    responses.current.push(...(await testEvery(50, 100)));
    setTestOneCallEvery50MS("done");
    capture("Test connexion", {
      extra: responses.current,
    });
    setTestLaunched(false);
  }

  async function testEvery(interval: number, numberOfTests: number) {
    const responses = [];
    const counter = 1;
    for (let i = 0; i < numberOfTests; i++) {
      await API.get({ path: "/check-auth" }).then((response) => {
        if (!response.ok) {
          responses.push({
            test: `Test call every ${interval}ms #${counter}`,
            response,
          });
        }
      });
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return responses;
  }

  async function stopTest() {
    if (testLaunched) {
      if (!window.confirm("Êtes-vous sûr de vouloir arrêter le test ?")) return;
      capture("Test connexion", {
        extra: responses.current,
      });
    }
    setOpen(false);
  }

  async function resetTest() {
    setTestLaunched(false);
    setTestOneCallEvery2Seconds("not-started");
    setTestOneCallEvery1Seconds("not-started");
    setTestOneCallEvery500MS("not-started");
    setTestOneCallEvery200MS("not-started");
    setTestOneCallEvery100MS("not-started");
    setTestOneCallEvery50MS("not-started");
  }

  function getTestIcon(status: "done" | "ongoing" | "not-started") {
    switch (status) {
      case "done":
        return "🏁";
      case "ongoing":
        return "🏎️";
      default:
        return "🚥";
    }
  }

  const testIsOver =
    testOneCallEvery2Seconds === "done" &&
    testOneCallEvery1Seconds === "done" &&
    testOneCallEvery500MS === "done" &&
    testOneCallEvery200MS === "done" &&
    testOneCallEvery100MS === "done" &&
    testOneCallEvery50MS === "done";

  return (
    <>
      <button type="button" className="button-classic !tw-shadow-none tw-border-none tw-w-full tw-text-left tw-pl-4" onClick={() => setOpen(true)}>
        Tester ma connexion
      </button>

      <ModalContainer
        open={open}
        onClose={stopTest}
        className="test-connexion"
        size={testLaunched && !testIsOver ? "3xl" : "full"}
        onAfterLeave={resetTest}
      >
        <ModalHeader title="Tester ma connexion" onClose={stopTest} />
        {!testLaunched && !testIsOver ? (
          <>
            <ModalBody className="tw-max-w-prose tw-mx-auto tw-px-4 tw-py-10">
              <p>Vous rencontrez des problèmes de connexion ?</p>
              <p>
                En cliquant sur le bouton ci-dessous, nous allons effectuer quelques tests de votre connexion à nos serveurs, et envoyer les résultats
                à notre équipe technique pour analyse.
              </p>
              <p className="tw-font-bold">Le test dure environ 2 minutes, ne fermez pas cette fenêtre svp !</p>
              <p>Merci de votre patience !</p>
              <button type="button" className="button-classic" onClick={launchTest}>
                Tester ma connexion
              </button>
            </ModalBody>
            <ModalFooter>
              <button type="button" className="button-classic" onClick={stopTest}>
                Annuler
              </button>
              <button type="button" className="button-submit" onClick={launchTest}>
                Tester ma connexion
              </button>
            </ModalFooter>
          </>
        ) : !testIsOver ? (
          <ModalBody className="tw-max-w-prose tw-mx-auto tw-py-10 tw-px-4">
            <ul className="tw-flex-col tw-flex tw-gap-y-2">
              <li>{getTestIcon(testOneCallEvery2Seconds)} Test 1: 1 appel toutes les 2 secondes pendant 10 secondes</li>
              <li>{getTestIcon(testOneCallEvery1Seconds)} Test 2: 1 appel toutes les 1 secondes pendant 10 secondes</li>
              <li>{getTestIcon(testOneCallEvery500MS)} Test 3: 1 appel toutes les 500ms pendant 10 secondes</li>
              <li>{getTestIcon(testOneCallEvery200MS)} Test 4: 1 appel toutes les 200ms pendant 10 secondes</li>
              <li>{getTestIcon(testOneCallEvery100MS)} Test 5: 1 appel toutes les 100ms pendant 10 secondes</li>
              <li>{getTestIcon(testOneCallEvery50MS)} Test 6: 1 appel toutes les 50ms pendant 5 secondes</li>
            </ul>
          </ModalBody>
        ) : (
          <>
            <ModalBody className="tw-max-w-prose tw-mx-auto tw-py-10 tw-px-4">
              <p>Tests terminés !</p>
              <p>Les résultats ont été envoyés à notre équipe technique pour analyse.</p>
              <p>Merci pour votre patience !</p>
            </ModalBody>
            <ModalFooter>
              <button type="button" className="button-classic" onClick={stopTest}>
                Fermer
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContainer>
    </>
  );
};

export default Account;
