import React, { useState } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import ButtonCustom from '../../components/ButtonCustom';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  fieldsPersonsCustomizableOptionsSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import SelectAsInput from '../../components/SelectAsInput';
import useApi from '../../services/api';
import DatePicker from 'react-datepicker';
import { dateForDatePicker } from '../../services/date';

const OutOfActiveList = ({ person }) => {
  const [open, setOpen] = useState(false);
  const API = useApi();

  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);

  const setPersons = useSetRecoilState(personsState);

  const handleSetOutOfActiveList = async (outOfActiveListReason = '', outOfActiveListDate = Date.now()) => {
    const outOfActiveList = !person.outOfActiveList;
    const response = await API.put({
      path: `/person/${person._id}`,
      body: preparePersonForEncryption(
        customFieldsPersonsMedical,
        customFieldsPersonsSocial
      )({ ...person, outOfActiveList: outOfActiveList, outOfActiveListReason, outOfActiveListDate }),
    });
    if (response.ok) {
      const newPerson = response.decryptedData;
      setPersons((persons) =>
        persons.map((p) => {
          if (p._id === person._id) return newPerson;
          return p;
        })
      );
      toast.success(person.name + (outOfActiveList ? ' est hors de la file active.' : ' est dans la file active.'));
    }
  };

  return (
    <>
      <ButtonCustom
        title={person.outOfActiveList ? 'Réintégrer dans la file active' : 'Sortie de file active'}
        type="button"
        onClick={() => (person.outOfActiveList ? handleSetOutOfActiveList() : setOpen(true))}
        color={'warning'}
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setOpen(false)}>Sortie de file active de {person.name}</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={person}
            onSubmit={async (body) => {
              await handleSetOutOfActiveList(body.outOfActiveListReason, body.outOfActiveListDate);
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
                          options={fieldsPersonsCustomizableOptions.find((f) => f.name === 'outOfActiveListReason').options}
                          name="outOfActiveListReason"
                          value={values.outOfActiveListReason || ''}
                          onChange={handleChange}
                          inputId="person-select-outOfActiveListReason"
                          classNamePrefix="person-select-outOfActiveListReason"
                        />
                      </label>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="person-birthdate">Date de sortie de file active</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={dateForDatePicker(values.outOfActiveListDate || Date.now())}
                          onChange={(date) => handleChange({ target: { value: date, name: 'outOfActiveListDate' } })}
                          dateFormat="dd/MM/yyyy"
                          id="outOfActiveListDate"
                        />
                      </div>
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
