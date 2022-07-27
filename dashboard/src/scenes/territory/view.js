import React from 'react';
import { Row, Col, FormGroup, Input, Label } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';

import { SmallHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';

import Observations from '../territory-observations/list';
import SelectCustom from '../../components/SelectCustom';
import { territoryTypes, territoriesState, prepareTerritoryForEncryption } from '../../recoil/territory';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const territory = territories.find((t) => t._id === id);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const API = useApi();

  useTitle(`${territory?.name} - Territoire`);

  if (!territory) return <Loading />;

  return (
    <>
      <SmallHeaderWithBackButton
        onRefresh={() =>
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          })
        }
      />
      <Formik
        initialValues={territory}
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
            toastr.success('Mis à jour !');
          }
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => {
          return (
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
                    <Label htmlFor="territory-select-types">Types</Label>
                    <SelectCustom
                      options={territoryTypes}
                      name="types"
                      onChange={(v) => handleChange({ currentTarget: { value: v, name: 'types' } })}
                      isClearable={false}
                      isMulti
                      value={values.types}
                      placeholder={' -- Choisir -- '}
                      getOptionValue={(i) => i}
                      getOptionLabel={(i) => i}
                      inputId="territory-select-types"
                      classNamePrefix="territory-select-types"
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="perimeter">Périmètre</Label>
                    <Input name="perimeter" id="perimeter" value={values.perimeter} onChange={handleChange} />
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <DeleteButtonAndConfirmModal
                  title={`Voulez-vous vraiment supprimer le territoire ${territory.name}`}
                  textToConfirm={territory.name}
                  onConfirm={async () => {
                    const res = await API.delete({ path: `/territory/${id}` });
                    if (res.ok) {
                      setTerritories((territories) => territories.filter((t) => t._id !== id));
                      setRefreshTrigger({
                        status: true,
                        options: { showFullScreen: false, initialLoad: false },
                      }); // to get all deleted in cascade
                      toastr.success('Suppression réussie');
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
