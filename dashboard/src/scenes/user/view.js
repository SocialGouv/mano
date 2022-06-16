import React, { useCallback, useEffect, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import { useRecoilState, useRecoilValue } from 'recoil';

import { SmallerHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import Box from '../../components/Box';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import SelectRole from '../../components/SelectRole';
import { organisationState, userState } from '../../recoil/auth';
import useApi from '../../services/api';
import { AppSentry } from '../../services/sentry';
import useTitle from '../../services/useTitle';

const View = () => {
  const [localUser, setLocalUser] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  const [user, setUser] = useRecoilState(userState);
  const organisation = useRecoilValue(organisationState);
  const API = useApi();
  useTitle(`Utilisateur ${user?.name}`);

  const getData = useCallback(async () => {
    const { data } = await API.get({ path: `/user/${id}` });
    setLocalUser(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    getData();
  }, [getData, id]);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/user/${id}` });
      if (!res.ok) return;
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  if (!localUser) return <Loading />;

  return (
    <>
      <SmallerHeaderWithBackButton />
      <Box>
        <Formik
          initialValues={{
            name: localUser.name,
            email: localUser.email,
            team: localUser.team,
            role: localUser.role,
            healthcareProfessional: localUser.healthcareProfessional,
          }}
          onSubmit={async (body, actions) => {
            try {
              if (!body.team?.length) return toastr.error('Erreur !', 'Au moins une équipe est obligatoire');
              body.organisation = organisation._id;
              const res = await API.put({ path: `/user/${id}`, body });
              if (!res.ok) return actions.setSubmitting(false);
              if (user._id === id) {
                const { data } = await API.get({ path: `/user/${id}` });
                setUser(data);
                AppSentry.setUser(data);
              }
              actions.setSubmitting(false);
              toastr.success('Mis à jour !');
            } catch (errorUpdatingUser) {
              console.log('error in updating user', errorUpdatingUser);
              toastr.error('Erreur!', errorUpdatingUser.message);
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="name">Nom</Label>
                    <Input name="name" id="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="email">Email</Label>
                    <Input name="email" id="email" value={values.email} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="team">Équipes</Label>
                    <div>
                      <SelectTeamMultiple
                        onChange={(team) => handleChange({ target: { value: team || [], name: 'team' } })}
                        organisation={organisation._id}
                        value={values.team || []}
                        colored
                        required
                        inputId="team"
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="role">Role</Label>
                    <SelectRole handleChange={handleChange} value={values.role} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <Label htmlFor="healthcareProfessional" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      id="healthcareProfessional"
                      style={{ marginRight: '0.5rem' }}
                      name="healthcareProfessional"
                      checked={values.healthcareProfessional}
                      onChange={() => {
                        handleChange({ target: { value: !values.healthcareProfessional, name: 'healthcareProfessional' } });
                      }}
                    />
                    Professionnel de santé
                  </Label>
                  <div>
                    <small className="text-muted">Un professionnel de santé à accès au dossier médical complet des personnes.</small>
                  </div>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {id !== user._id && (
                  <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                )}
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
              </div>
            </React.Fragment>
          )}
        </Formik>
      </Box>
    </>
  );
};

export default View;
