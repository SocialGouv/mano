import React, { useState } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import ButtonCustom from '../../components/ButtonCustom';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import SelectAsInput from '../../components/SelectAsInput';
import useApi from '../../services/api';

const OutOfActiveList = ({ person }) => {
  const [open, setOpen] = useState(false);
  const API = useApi();

  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);

  const setPersons = useSetRecoilState(personsState);

  const handleSetOutOfActiveList = async (outOfActiveListReason = '') => {
    const outOfActiveList = !person.outOfActiveList;
    const response = await API.put({
      path: `/person/${person._id}`,
      body: preparePersonForEncryption(
        customFieldsPersonsMedical,
        customFieldsPersonsSocial
      )({ ...person, outOfActiveList: outOfActiveList, outOfActiveListReason }),
    });
    if (response.ok) {
      const newPerson = response.decryptedData;
      setPersons((persons) =>
        persons.map((p) => {
          if (p._id === person._id) return newPerson;
          return p;
        })
      );
      toastr.success('Mise à jour réussie', person.name + (person.outOfActiveList ? ' est hors de la file active.' : ' est dans file active.'));
    }
  };

  return (
    <>
      <ButtonCustom
        title={person.outOfActiveList ? 'Réintégrer dans la file active' : 'Sortie de file active'}
        type="button"
        style={{ marginRight: 10 }}
        onClick={() => (person.outOfActiveList ? handleSetOutOfActiveList() : setOpen(true))}
        width={person.outOfActiveList ? 250 : 200}
        color={'warning'}
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setOpen(false)}>Sortie de file active de {person.name}</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={person}
            onSubmit={async (body) => {
              await handleSetOutOfActiveList(body.outOfActiveListReason);
              setOpen(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <label htmlFor="person-select-outOfActiveListReason">
                        Veuillez préciser le motif de sortie
                        <SelectAsInput
                          styles={{ width: '800px' }}
                          style={{ width: '800px' }}
                          options={customFieldsPersonsSocial.find((f) => f.name === 'outOfActiveListReason').options}
                          name="outOfActiveListReason"
                          value={values.outOfActiveListReason || ''}
                          onChange={handleChange}
                          inputId="person-select-outOfActiveListReason"
                          classNamePrefix="person-select-outOfActiveListReason"
                        />
                      </label>
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  onClick={() => !isSubmitting && handleSubmit()}
                  disabled={!!isSubmitting}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

export default OutOfActiveList;
