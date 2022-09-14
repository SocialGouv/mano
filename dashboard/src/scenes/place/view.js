import React, { Fragment } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import { SmallHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import { personsState } from '../../recoil/persons';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { placesState, preparePlaceForEncryption } from '../../recoil/places';
import { useRecoilState, useRecoilValue } from 'recoil';
import useApi from '../../services/api';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const [places, setPlaces] = useRecoilState(placesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const persons = useRecoilValue(personsState);

  const API = useApi();

  const place = places.find((p) => p._id === id);
  useTitle(`${place?.name} - Lieu fréquenté`);

  if (!place) return <Loading />;

  return (
    <>
      <SmallHeaderWithBackButton refreshButton />
      <Formik
        initialValues={place}
        enableReinitialize
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
                  <Label htmlFor="name">Nom</Label>
                  <Input name="name" id="name" value={values.name} onChange={handleChange} />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label htmlFor="persons">Personnes suivies</Label>
                  <ul style={{ marginBottom: 0 }}>
                    {relsPersonPlace
                      .filter((rel) => rel.place === place._id)
                      .map((rel) => persons.find((p) => p._id === rel.person))
                      .map(({ _id, name }, index, arr) => (
                        <li key={_id}>
                          {name}
                          {index < arr.length - 1 && <br />}
                        </li>
                      ))}
                  </ul>
                </FormGroup>
              </Col>
            </Row>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <DeleteButtonAndConfirmModal
                title={`Voulez-vous vraiment supprimer le lieu ${place.name}`}
                textToConfirm={place.name}
                onConfirm={async () => {
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
                }}>
                <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
                  Cette opération est irréversible
                  <br />
                  et entrainera la suppression définitive de ce lieu et de toutes les notifications de personnes passées dans ce lieu.
                </span>
              </DeleteButtonAndConfirmModal>
              <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} />
            </div>
          </React.Fragment>
        )}
      </Formik>
    </>
  );
};

export default View;
