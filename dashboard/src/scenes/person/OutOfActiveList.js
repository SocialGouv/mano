import React, { useState } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import ButtonCustom from '../../components/ButtonCustom';
import { outOfActiveListReasonOptions, usePersons } from '../../recoil/persons';
import SelectAsInput from '../../components/SelectAsInput';

const OutOfActiveList = ({ person }) => {
  const [open, setOpen] = useState(false);
  const { updatePerson } = usePersons();

  const handleSetOutOfActiveList = async (outOfActiveListReason = '') => {
    const res = await updatePerson({ ...person, outOfActiveList: !person.outOfActiveList, outOfActiveListReason });
    if (res?.ok) {
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
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
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
                      <label>
                        Veuillez préciser le motif de sortie
                        <SelectAsInput
                          styles={{ width: '800px' }}
                          style={{ width: '800px' }}
                          options={outOfActiveListReasonOptions}
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
                  color="info"
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
