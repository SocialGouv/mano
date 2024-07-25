import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Formik } from "formik";
import SelectUser from "./SelectUser";
import { teamsState, userState } from "../recoil/auth";
import { useRecoilValue } from "recoil";
import API, { tryFetchExpectOk } from "../services/api";
import { encryptPassage } from "../recoil/passages";
import SelectTeam from "./SelectTeam";
import SelectPerson from "./SelectPerson";
import DatePicker from "./DatePicker";
import { outOfBoundariesDate } from "../services/date";
import AutoResizeTextarea from "./AutoresizeTextArea";
import { useDataLoader } from "./DataLoader";
import { ModalContainer, ModalHeader, ModalFooter, ModalBody } from "./tailwind/Modal";

const Passage = ({ passage, personId, onFinished }) => {
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refresh } = useDataLoader();

  useEffect(() => {
    setOpen(!!passage);
  }, [passage]);

  const onDeletePassage = async () => {
    setIsDeleting(true);
    const confirm = window.confirm("Êtes-vous sûr ?");
    if (confirm) {
      const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/passage/${passage?._id}` }));
      if (!error) {
        await refresh();
        toast.success("Suppression réussie");
        setOpen(false);
      }
    }
    setIsDeleting(false);
  };

  const isNew = !passage?._id;
  const isForPerson = !!passage?.person;
  const showMultiSelect = isNew && !isForPerson;
  const isEditingAnonymous = !isNew && !isForPerson;

  return (
    <ModalContainer
      dataTestId="modal-passage-create-edit-delete"
      open={!!open && !!passage}
      onClose={() => setOpen(false)}
      size="3xl"
      onAfterLeave={onFinished}
    >
      <ModalHeader onClose={() => setOpen(false)} title={isNew ? "Enregistrer un passage" : "Éditer le passage"} />
      <Formik
        initialValues={{ date: new Date(), ...passage, anonymousNumberOfPassages: 1, persons: passage?.person ? [passage?.person] : [] }}
        onSubmit={async (body, actions) => {
          if (!body.user) return toast.error("L'utilisateur est obligatoire");
          if (!body.date) return toast.error("La date est obligatoire");
          if (outOfBoundariesDate(body.date)) return toast.error("La date est hors limites (entre 1900 et 2100)");
          if (!body.team) return toast.error("L'équipe est obligatoire");
          if (body.anonymous && !body.anonymousNumberOfPassages) return toast.error("Veuillez spécifier le nombre de passages anonymes");
          if (!body.anonymous && (showMultiSelect ? !body.persons?.length : !body.person?.length) && !isEditingAnonymous)
            return toast.error("Veuillez spécifier une personne");

          if (isNew) {
            const newPassage = {
              date: body.date,
              team: body.team,
              user: user._id,
              person: personId,
              comment: body.comment,
            };

            // TODO: traiter les erreurs dans tous ces cas
            if (body.anonymous) {
              for (let i = 0; i < body.anonymousNumberOfPassages; i++) {
                await API.post({
                  path: "/passage",
                  body: await encryptPassage(newPassage),
                });
              }
            } else if (showMultiSelect) {
              for (const person of body.persons) {
                const [passageError] = await tryFetchExpectOk(async () =>
                  API.post({
                    path: "/passage",
                    body: await encryptPassage({ ...newPassage, person }),
                  })
                );
                if (passageError) {
                  toast.error("Erreur lors de l'enregistrement du passage");
                }
              }
            } else {
              const [passageError] = await tryFetchExpectOk(async () =>
                API.post({
                  path: "/passage",
                  body: await encryptPassage({ ...newPassage, person: body.person }),
                })
              );
              if (passageError) {
                toast.error("Erreur lors de l'enregistrement du passage");
              }
            }

            await refresh();
            setOpen(false);
            toast.success(body.person?.length > 1 ? "Passage enregistré !" : "Passages enregistrés !");
            return;
          }
          const [error] = await tryFetchExpectOk(async () =>
            API.put({
              path: `/passage/${passage?._id}`,
              body: await encryptPassage(body),
            })
          );
          if (error) {
            toast.error("Erreur lors de la mise à jour du passage");
            actions.setSubmitting(false);
            return;
          }
          await refresh();
          setOpen(false);
          toast.success("Passage mis à jour");
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting }) => {
          const buttonsDisabled = isSubmitting || isDeleting || !open;
          return (
            <>
              <ModalBody>
                <div className="tw-flex-wrap tw-flex-row tw-w-full tw-flex tw-mb-2">
                  {!!isNew && !isForPerson && (
                    <div className="tw-basis-full tw-px-4 tw-py-2">
                      <div className="tw-flex tw-flex-1 tw-flex-col">
                        <label htmlFor="create-anonymous-passages">
                          <input
                            type="checkbox"
                            id="create-anonymous-passages"
                            className="tw-mr-2"
                            name="anonymous"
                            checked={values.anonymous}
                            onChange={() => handleChange({ target: { value: !values.anonymous, name: "anonymous" } })}
                          />
                          Passage(s) anonyme(s) <br />
                          <small className="text-muted">Cochez cette case pour enregistrer plutôt des passages anonymes</small>
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="tw-basis-1/2 tw-px-4 tw-py-2">
                    <label htmlFor="date">Date</label>
                    <div>
                      <DatePicker withTime id="date" defaultValue={values.date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="tw-basis-1/2 tw-px-4 tw-py-2">
                    {values.anonymous ? (
                      <>
                        <label htmlFor="number-of-anonymous-passages">Nombre de passages anonymes</label>
                        <input
                          name="anonymousNumberOfPassages"
                          type="number"
                          value={values.anonymousNumberOfPassages}
                          onChange={handleChange}
                          id="number-of-anonymous-passages"
                        />
                      </>
                    ) : showMultiSelect ? (
                      <SelectPerson value={values.persons} onChange={handleChange} isClearable isMulti name="persons" />
                    ) : !isEditingAnonymous ? (
                      <SelectPerson value={values.person} onChange={handleChange} />
                    ) : null}
                  </div>
                  {!isEditingAnonymous ? (
                    <div className="tw-basis-full tw-px-4 tw-py-2">
                      <label htmlFor="update-passage-comment">Commentaire</label>
                      <div className="tw-rounded tw-border tw-border-gray-300">
                        <AutoResizeTextarea
                          id="update-passage-comment"
                          name="comment"
                          placeholder="Tapez votre commentaire ici..."
                          value={values.comment}
                          rows={7}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="tw-basis-1/2 tw-px-4 tw-py-2">
                    <label htmlFor="update-passage-user-select">Créé par</label>
                    <SelectUser
                      inputId="update-passage-user-select"
                      value={values.user || user._id}
                      onChange={(userId) => handleChange({ target: { value: userId, name: "user" } })}
                    />
                  </div>
                  <div className="tw-basis-1/2 tw-px-4 tw-py-2">
                    <label htmlFor="update-passage-team-select">Sous l'équipe</label>
                    <SelectTeam
                      teams={user.role === "admin" ? teams : user.teams}
                      teamId={values.team}
                      onChange={(team) => handleChange({ target: { value: team._id, name: "team" } })}
                      inputId="update-passage-team-select"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button type="button" disabled={buttonsDisabled} name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
                  Fermer
                </button>
                {!isNew && (
                  <button
                    type="button"
                    name="delete"
                    className="button-destructive"
                    onClick={onDeletePassage}
                    disabled={buttonsDisabled}
                    title="Seul l'auteur/trice du passage peut le supprimer"
                  >
                    {isDeleting ? "Suppression en cours..." : "Supprimer"}
                  </button>
                )}
                <button
                  type="submit"
                  className="button-submit !tw-bg-main"
                  onClick={handleSubmit}
                  disabled={buttonsDisabled}
                  title="Seul l'auteur/trice du passage peut le modifier"
                >
                  {isSubmitting ? "Enregistrement en cours..." : "Enregistrer"}
                </button>
              </ModalFooter>
            </>
          );
        }}
      </Formik>
    </ModalContainer>
  );
};

export default Passage;
