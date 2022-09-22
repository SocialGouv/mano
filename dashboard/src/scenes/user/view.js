import React, { useCallback, useEffect, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';

import { SmallHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import SelectRole from '../../components/SelectRole';
import { organisationState, userState } from '../../recoil/auth';
import useApi from '../../services/api';
import { AppSentry } from '../../services/sentry';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';

const View = () => {
  const [localUser, setLocalUser] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  const [user, setUser] = useRecoilState(userState);
  const organisation = useRecoilValue(organisationState);
  const API = useApi();
  useTitle(`Utilisateur ${user?.name}`);

  const getUserData = useCallback(async () => {
    const { data } = await API.get({ path: `/user/${id}` });
    setLocalUser(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    getUserData();
  }, [getUserData, id]);

  if (!localUser) return <Loading />;

  return (
    <>
      <SmallHeaderWithBackButton />
      <Formik
        initialValues={{
          name: localUser.name,
          email: localUser.email,
          team: localUser.team,
          role: localUser.role,
          healthcareProfessional: localUser.healthcareProfessional,
        }}
        enableReinitialize
        onSubmit={async (body, actions) => {
          try {
            if (!body.team?.length) return toast.error('Au moins une équipe est obligatoire');
            body.organisation = organisation._id;
            const res = await API.put({ path: `/user/${id}`, body });
            if (!res.ok) return actions.setSubmitting(false);
            if (user._id === id) {
              const { data } = await API.get({ path: `/user/${id}` });
              setUser(data);
              AppSentry.setUser(data);
            }
            actions.setSubmitting(false);
            toast.success('Mis à jour !');
          } catch (errorUpdatingUser) {
            console.log('error in updating user', errorUpdatingUser);
            toast.error(errorUpdatingUser.message);
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {id !== user._id && (
                <DeleteButtonAndConfirmModal
                  title={`Voulez-vous vraiment supprimer l'utilisateur ${organisation.name}`}
                  textToConfirm={organisation.name}
                  onConfirm={async () => {
                    const res = await API.delete({ path: `/user/${id}` });
                    if (!res.ok) return;
                    toast.success('Suppression réussie');
                    history.goBack();
                  }}>
                  <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>Cette opération est irréversible</span>
                </DeleteButtonAndConfirmModal>
              )}
              <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} />
            </div>
          </React.Fragment>
        )}
      </Formik>
    </>
  );
};

export default View;
