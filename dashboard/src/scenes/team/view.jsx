import React, { useEffect, useMemo, useState } from "react";
import { FormGroup, Input, Label, Row, Col } from "reactstrap";

import { useParams, useHistory } from "react-router-dom";
import { Formik } from "formik";
import { toast } from "react-toastify";

import Loading from "../../components/loading";
import ButtonCustom from "../../components/ButtonCustom";
import NightSessionModale from "../../components/NightSessionModale";
import { currentTeamState, teamsState } from "../../recoil/auth";
import API, { tryFetch, tryFetchExpectOk } from "../../services/api";
import { useRecoilState, useRecoilValue } from "recoil";
import useTitle from "../../services/useTitle";
import DeleteButtonAndConfirmModal from "../../components/DeleteButtonAndConfirmModal";
import { actionsState } from "../../recoil/actions";
import { consultationsState } from "../../recoil/consultations";
import { commentsState } from "../../recoil/comments";
import { territoryObservationsState } from "../../recoil/territoryObservations";
import { personsState } from "../../recoil/persons";
import { passagesState } from "../../recoil/passages";
import { rencontresState } from "../../recoil/rencontres";
import BackButton from "../../components/backButton";
import { errorMessage } from "../../utils";

const View = () => {
  const [team, setTeam] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  const actions = useRecoilValue(actionsState);
  const consultations = useRecoilValue(consultationsState);
  const comments = useRecoilValue(commentsState);
  const observations = useRecoilValue(territoryObservationsState);
  const persons = useRecoilValue(personsState);
  const passages = useRecoilValue(passagesState);
  const rencontres = useRecoilValue(rencontresState);

  const cantDeleteMessage = useMemo(() => {
    const actionsInTeam = actions.filter((a) => a.teams?.includes(id));
    const consultationsInTeam = consultations.filter((c) => c.teams?.includes(id));
    const commentsInTeam = comments.filter((c) => c.team === id);
    const observationsInTeam = observations.filter((o) => o.team === id);
    const personsInTeam = persons.filter((p) => p.assignedTeams?.includes(id));
    const passagesInTeam = passages.filter((p) => p.team === id);
    const rencontresInTeam = rencontres.filter((r) => r.team === id);
    let items = [];
    if (actionsInTeam.length) items.push(`${actionsInTeam.length} actions`);
    if (consultationsInTeam.length) items.push(`${consultationsInTeam.length} consultations`);
    if (commentsInTeam.length) items.push(`${commentsInTeam.length} commentaires`);
    if (observationsInTeam.length) items.push(`${observationsInTeam.length} observations`);
    if (personsInTeam.length) items.push(`${personsInTeam.length} personnes`);
    if (passagesInTeam.length) items.push(`${passagesInTeam.length} passages`);
    if (rencontresInTeam.length) items.push(`${rencontresInTeam.length} rencontres`);
    return items.length ? `Vous ne pouvez pas supprimer cette équipe, vous avez ${items.join(", ")} qui y sont liées.` : null;
  }, [actions, consultations, comments, observations, persons, passages, rencontres, id]);

  useTitle(`Équipes ${team?.name}`);

  const [currentTeam, setCurrentTeam] = useRecoilState(currentTeamState);
  const [teams, setTeams] = useRecoilState(teamsState);

  const getTeam = async () => {
    const [error, response] = await tryFetchExpectOk(async () => API.get({ path: `/team/${id}` }));
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    setTeam(response.data);
  };

  useEffect(() => {
    getTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!team) return <Loading />;

  return (
    <>
      <div className="tw-my-8">
        <BackButton />
      </div>
      <Formik
        initialValues={team}
        enableReinitialize
        onSubmit={async (body) => {
          const [error, response] = await tryFetchExpectOk(async () => API.put({ path: `/team/${team._id}`, body }));
          if (error) return toast.error(errorMessage(error));
          if (!error) {
            toast.success("Mise à jour !");
            setTeams(
              teams.map((t) => {
                if (t._id !== id) return t;
                return response.data;
              })
            );
            if (currentTeam._id === id) setCurrentTeam(response.data);
          }
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <React.Fragment>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label htmlFor="name">Nom</Label>
                  <Input name="name" id="name" value={values.name} onChange={handleChange} />
                </FormGroup>
              </Col>
              <Col md={6} />
              <Col md={12}>
                <FormGroup>
                  <Label />
                  <div style={{ display: "flex", marginLeft: 20, width: "80%" }}>
                    <label htmlFor="nightSession">Équipe de nuit</label>
                    <Input type="checkbox" name="nightSession" id="nightSession" checked={values.nightSession} onChange={handleChange} />
                    <NightSessionModale />
                  </div>
                </FormGroup>
              </Col>
            </Row>
            <div className="tw-flex tw-justify-end tw-gap-4">
              {cantDeleteMessage ? (
                <button
                  className="button-destructive"
                  onClick={() => {
                    toast.error(cantDeleteMessage);
                  }}
                >
                  Supprimer
                </button>
              ) : (
                <DeleteButtonAndConfirmModal
                  title={`Voulez-vous vraiment supprimer l'équipe ${team.name}`}
                  textToConfirm={team.name}
                  // disabled={teams.length === 1}
                  // disabledTitle="Vous ne pouvez pas supprimer la dernière équipe"
                  onConfirm={async () => {
                    const [error] = await tryFetch(async () => await API.delete({ path: `/team/${id}` }));
                    if (error) {
                      return toast.error(errorMessage(error));
                    }
                    setTeams(teams.filter((t) => t._id !== id));
                    toast.success("Suppression réussie");
                    history.goBack();
                  }}
                >
                  <span style={{ marginBottom: 30, display: "block", width: "100%", textAlign: "center" }}>
                    Cette opération est irréversible
                    <br />
                  </span>
                </DeleteButtonAndConfirmModal>
              )}
              <ButtonCustom title={"Mettre à jour"} loading={isSubmitting} onClick={handleSubmit} />
            </div>
          </React.Fragment>
        )}
      </Formik>
    </>
  );
};

export default View;
