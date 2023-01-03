import React from 'react';
import { Row } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik } from 'formik';

import { SmallHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';

import Observations from '../territory-observations/list';
import { territoriesState, territoryEncryptedFieldsSelector, usePrepareTerritoryForEncryption } from '../../recoil/territory';
import { useRecoilState, useRecoilValue } from 'recoil';
import useApi from '../../services/api';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import CustomFieldInput from '../../components/CustomFieldInput';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const territoryFields = useRecoilValue(territoryEncryptedFieldsSelector);
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const territory = territories.find((t) => t._id === id);
  const API = useApi();
  const prepareTerritoryForEncryption = usePrepareTerritoryForEncryption();

  useTitle(`${territory?.name} - Territoire`);

  if (!territory) return <Loading />;

  return (
    <>
      <SmallHeaderWithBackButton refreshButton />
      <Formik
        initialValues={territory}
        enableReinitialize
        onSubmit={async (body) => {
          const res = await API.put({
            path: `/territory/${territory._id}`,
            body: prepareTerritoryForEncryption(body),
          });
          if (res.ok) {
            setTerritories((territories) =>
              territories.map((a) => {
                if (a._id === territory._id) return res.decryptedData;
                return a;
              })
            );
            toast.success('Mis à jour !');
          }
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => {
          return (
            <React.Fragment>
              <Row>
                <CustomFieldInput
                  field={{ type: 'text', label: 'Nom', name: 'name' }}
                  colWidth={6}
                  model="territory"
                  name="name"
                  values={values}
                  handleChange={handleChange}
                />
                {territoryFields
                  .filter((f) => !['name', 'user'].includes(f.name))
                  .map((field) => (
                    <CustomFieldInput
                      key={field.name}
                      field={field}
                      colWidth={6}
                      model="territory"
                      name={field.name}
                      values={values}
                      handleChange={handleChange}
                    />
                  ))}
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <DeleteButtonAndConfirmModal
                  title={`Voulez-vous vraiment supprimer le territoire ${territory.name}`}
                  textToConfirm={territory.name}
                  onConfirm={async () => {
                    const res = await API.delete({ path: `/territory/${id}` });
                    if (res.ok) {
                      setTerritories((territories) => territories.filter((t) => t._id !== id));
                      for (let obs of territoryObservations.filter((o) => o.territory === id)) {
                        const res = await API.delete({ path: `/territory-observation/${obs._id}` });
                        if (res.ok) {
                          setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== obs._id));
                        }
                      }
                      toast.success('Suppression réussie');
                      history.goBack();
                    }
                  }}>
                  <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
                    Cette opération est irréversible
                    <br />
                    et entrainera la suppression définitive de toutes les observations liées au territoire.
                  </span>
                </DeleteButtonAndConfirmModal>
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} />
              </div>
            </React.Fragment>
          );
        }}
      </Formik>
      <Observations territory={territory || { _id: id }} />
    </>
  );
};

export default View;
