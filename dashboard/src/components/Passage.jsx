import React, { useEffect, useState } from "react";
import { Modal, Input, Col, Row, ModalHeader, ModalBody, FormGroup, Label } from "reactstrap";
import { toast } from "react-toastify";
import { Formik } from "formik";
import ButtonCustom from "./ButtonCustom";
import SelectUser from "./SelectUser";
import { teamsState, userState } from "../recoil/auth";
import { useRecoilValue } from "recoil";
import API, { tryFetchExpectOk } from "../services/api";
import { preparePassageForEncryption, encryptPassage } from "../recoil/passages";
import SelectTeam from "./SelectTeam";
import SelectPerson from "./SelectPerson";
import DatePicker from "./DatePicker";
import { outOfBoundariesDate } from "../services/date";
import AutoResizeTextarea from "./AutoresizeTextArea";
import { useDataLoader } from "./DataLoader";

const Passage = ({ passage, personId, onFinished }) => {
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const [open, setOpen] = useState(false);
  const { refresh } = useDataLoader();

  useEffect(() => {
    setOpen(!!passage);
  }, [passage]);

  const onCancelRequest = () => {
    setOpen(false);
    onFinished();
  };

  const onDeletePassage = async () => {
    const confirm = window.confirm("Êtes-vous sûr ?");
    if (confirm) {
      const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/passage/${passage._id}` }));
      if (!error) {
        await refresh();
        toast.success("Suppression réussie");
        setOpen(false);
        onFinished();
      }
    }
  };

  const isNew = !passage?._id;
  const isForPerson = !!passage?.person;
  const showMultiSelect = isNew && !isForPerson;

  return (
    <>
      <Modal zIndex={5000} isOpen={!!open && !!passage} toggle={onCancelRequest} size="lg" backdrop="static">
        <ModalHeader toggle={onCancelRequest}>{isNew ? "Enregistrer un passage" : "Éditer le passage"}</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ date: new Date(), ...passage, anonymousNumberOfPassages: 1, persons: passage?.person ? [passage.person] : [] }}
            onSubmit={async (body, actions) => {
              if (!body.user) return toast.error("L'utilisateur est obligatoire");
              if (!body.date) return toast.error("La date est obligatoire");
              if (outOfBoundariesDate(body.date)) return toast.error("La date est hors limites (entre 1900 et 2100)");
              if (!body.team) return toast.error("L'équipe est obligatoire");
              if (body.anonymous && !body.anonymousNumberOfPassages) return toast.error("Veuillez spécifier le nombre de passages anonymes");
              if (!body.anonymous && (showMultiSelect ? !body.persons?.length : !body.person?.length))
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
                onFinished();
                toast.success(body.person?.length > 1 ? "Passage enregistré !" : "Passages enregistrés !");
                actions.setSubmitting(false);
                return;
              }
              const [error] = await tryFetchExpectOk(async () =>
                API.put({
                  path: `/passage/${passage._id}`,
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
              onFinished();
              toast.success("Passage mis à jour");
              actions.setSubmitting(false);
            }}
          >
            {({ values, handleChange, handleSubmit, isSubmitting }) => {
              return (
                <React.Fragment>
                  <Row>
                    {!!isNew && !isForPerson && (
                      <Col md={12}>
                        <FormGroup>
                          <Label htmlFor="create-anonymous-passages">
                            <input
                              type="checkbox"
                              id="create-anonymous-passages"
                              style={{ marginRight: "0.5rem" }}
                              name="anonymous"
                              checked={values.anonymous}
                              onChange={() => handleChange({ target: { value: !values.anonymous, name: "anonymous" } })}
                            />
                            Passage(s) anonyme(s) <br />
                            <small className="text-muted">Cochez cette case pour enregistrer plutôt des passages anonymes</small>
                          </Label>
                        </FormGroup>
                      </Col>
                    )}
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="date">Date</Label>
                        <div>
                          <DatePicker withTime id="date" defaultValue={values.date} onChange={handleChange} />
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        {values.anonymous ? (
                          <>
                            <Label htmlFor="number-of-anonymous-passages">Nombre de passages anonymes</Label>
                            <Input
                              name="anonymousNumberOfPassages"
                              type="number"
                              value={values.anonymousNumberOfPassages}
                              onChange={handleChange}
                              id="number-of-anonymous-passages"
                            />
                          </>
                        ) : showMultiSelect ? (
                          <SelectPerson value={values.persons} onChange={handleChange} isClearable isMulti name="persons" />
                        ) : (
                          <SelectPerson value={values.person} onChange={handleChange} />
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <Label htmlFor="update-passage-comment">Commentaire</Label>
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
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="update-passage-user-select">Créé par</Label>
                        <SelectUser
                          inputId="update-passage-user-select"
                          value={values.user || user._id}
                          onChange={(userId) => handleChange({ target: { value: userId, name: "user" } })}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="update-passage-team-select">Sous l'équipe</Label>
                        <SelectTeam
                          teams={user.role === "admin" ? teams : user.teams}
                          teamId={values.team}
                          onChange={(team) => handleChange({ target: { value: team._id, name: "team" } })}
                          inputId="update-passage-team-select"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <br />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                    {!isNew && <ButtonCustom title="Supprimer" type="button" color="danger" onClick={onDeletePassage} />}
                    <ButtonCustom title="Enregistrer" loading={isSubmitting} onClick={() => !isSubmitting && handleSubmit()} />
                  </div>
                </React.Fragment>
              );
            }}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

export default Passage;
