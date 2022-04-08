import React from 'react';
import { Row, Col, FormGroup, Input, Label } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';

import 'react-datepicker/dist/react-datepicker.css';

import { SmallerHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import Box from '../../components/Box';
import ButtonCustom from '../../components/ButtonCustom';

import Observations from '../territory-observations/list';
import SelectCustom from '../../components/SelectCustom';
import { territoryTypes, territoriesState, prepareTerritoryForEncryption } from '../../recoil/territory';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';
import { territoryObservationsState } from '../../recoil/territoryObservations';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const territory = territories.find((t) => t._id === id);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const API = useApi();

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/territory/${id}` });
      if (res.ok) {
        setTerritories((territories) => territories.filter((t) => t._id !== id));
        for (let obs of territoryObservations.filter((o) => o.territory === id)) {
          const res = await API.delete({ path: `/territory-observation/${obs._id}` });
          if (res.ok) {
            setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== obs._id));
          }
        }
        toastr.success('Suppression réussie');
        history.goBack();
      }
      return res;
    }
  };

  if (!territory) return <Loading />;

  return (
    <>
      <SmallerHeaderWithBackButton
        onRefresh={() =>
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          })
        }
      />
      <Box>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
              </React.Fragment>
            );
          }}
        </Formik>
      </Box>
      <Observations territory={territory || { _id: id }} />
    </>
  );
};

export default View;
