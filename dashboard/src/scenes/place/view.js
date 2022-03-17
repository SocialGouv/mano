/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import { SmallerHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import Box from '../../components/Box';
import { personsState } from '../../recoil/persons';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { placesState, preparePlaceForEncryption } from '../../recoil/places';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const [places, setPlaces] = useRecoilState(placesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const persons = useRecoilValue(personsState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const API = useApi();

  const place = places.find((p) => p._id === id);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const placeRes = await API.delete({ path: `/place/${id}` });
      if (placeRes.ok) {
        setPlaces((places) => places.filter((p) => p._id !== id));
        for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.place === id)) {
          const res = await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
          if (res.ok) {
            setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace._id));
          }
        }
        toastr.success('Suppression réussie');
        history.goBack();
      }
    }
  };

  if (!place) return <Loading />;

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
          initialValues={place}
          onSubmit={async (body) => {
            const response = await API.put({
              path: `/place/${place._id}`,
              body: preparePlaceForEncryption(body),
            });
            if (response.ok) {
              setPlaces((places) =>
                places
                  .map((p) => {
                    if (p._id === place._id) return response.decryptedData;
                    return p;
                  })
                  .sort((p1, p2) => p1.name.localeCompare(p2.name))
              );
              toastr.success('Mise à jour !');
            } else {
              toastr.error('Erreur!', response.error);
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Nom</Label>
                    <Input name="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Personnes suivies</Label>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: relsPersonPlace
                          .filter((rel) => rel.place === place._id)
                          .map((rel) => persons.find((p) => p._id === rel.person)?.name)
                          .join('<br/>'),
                      }}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
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
