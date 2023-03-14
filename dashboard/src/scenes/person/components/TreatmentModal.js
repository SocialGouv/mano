import React, { useEffect, useMemo, useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState, useRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import ButtonCustom from '../../../components/ButtonCustom';
import { personsState, usePreparePersonForEncryption, personFieldsSelector, flattenedCustomFieldsPersonsSelector } from '../../../recoil/persons';
import { currentTeamState, organisationState, usersState, userState } from '../../../recoil/auth';
import { dayjsInstance, formatDateWithFullMonth, formatTime, outOfBoundariesDate } from '../../../services/date';
import API from '../../../services/api';
import useSearchParamState from '../../../services/useSearchParamState';
import SelectAsInput from '../../../components/SelectAsInput';
import CustomFieldInput from '../../../components/CustomFieldInput';
import Table from '../../../components/table';
import ActionStatus from '../../../components/ActionStatus';
import SelectCustom from '../../../components/SelectCustom';
import CustomFieldDisplay from '../../../components/CustomFieldDisplay';
import DateBloc from '../../../components/DateBloc';
import { mappedIdsToLabels, DONE, CANCEL, sortActionsOrConsultations } from '../../../recoil/actions';
import Documents from '../../../components/Documents';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { prepareTreatmentForEncryption, treatmentsState } from '../../../recoil/treatments';
import { medicalFileState, prepareMedicalFileForEncryption, customFieldsMedicalFileSelector } from '../../../recoil/medicalFiles';
import { modalConfirmState } from '../../../components/ModalConfirm';
import ActionOrConsultationName from '../../../components/ActionOrConsultationName';
import { useLocalStorage } from 'react-use';
import ConsultationModal from '../../../components/ConsultationModal';
import { consultationsState, disableConsultationRow } from '../../../recoil/consultations';
import DatePicker from '../../../components/DatePicker';

/**
 * @param {Object} props
 * @param {Function} props.onClose
 * @param {Boolean} props.isNewTreatment
 * @param {Object} props.treatment
 * @param {Object} props.person
 */
export default function TreatmentModal({ onClose, isNewTreatment, treatment, person }) {
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const [allTreatments, setAllTreatments] = useRecoilState(treatmentsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);

  const currentTreatment = useMemo(() => {
    if (isNewTreatment) {
      return {
        _id: uuidv4(),
        startDate: new Date(),
        endDate: null,
        name: '',
        dosage: '',
        frequency: '',
        indication: '',
        user: user._id,
        person: person._id,
        organisation: organisation._id,
      };
    }
    return treatment;
  }, [isNewTreatment, treatment, user, person, organisation]);

  return (
    <Modal isOpen={true} toggle={onClose} size="lg" backdrop="static">
      <Formik
        enableReinitialize
        initialValues={currentTreatment}
        validate={(values) => {
          const errors = {};
          if (!values._id) errors._id = "L'identifiant est obligatoire";
          if (!values.name) errors.name = 'Le nom est obligatoire';
          if (!values.dosage) errors.dosage = 'Le dosage est obligatoire';
          if (!values.frequency) errors.frequency = 'La fréquence est obligatoire';
          if (!values.indication) errors.indication = "L'indication est obligatoire";
          if (!values.startDate) errors.startDate = 'La date de début est obligatoire';
          if (!errors.startDate && outOfBoundariesDate(values.startDate))
            errors.startDate = 'La date de début de traitement est hors limites (entre 1900 et 2100)';
          if (values.endDate && outOfBoundariesDate(values.endDate))
            errors.endDate = 'La date de fin de traitement est hors limites (entre 1900 et 2100)';

          return errors;
        }}
        onSubmit={async (values) => {
          const treatmentResponse = isNewTreatment
            ? await API.post({
                path: '/treatment',
                body: prepareTreatmentForEncryption(values),
              })
            : await API.put({
                path: `/treatment/${currentTreatment._id}`,
                body: prepareTreatmentForEncryption({ ...values, user: values.user || user._id }),
              });
          if (!treatmentResponse.ok) {
            toast.error("Impossible d'enregistrer le traitement. Notez toutes les informations et contactez le support.");
          }
          if (isNewTreatment) {
            setAllTreatments((all) => [...all, treatmentResponse.decryptedData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
            toast.success('Traitement créé !');
          } else {
            setAllTreatments((all) =>
              all
                .map((c) => {
                  if (c._id === currentTreatment._id) return treatmentResponse.decryptedData;
                  return c;
                })
                .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            );
            toast.success('Traitement mis à jour !');
          }
          onClose();
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting, errors, touched }) => (
          <React.Fragment>
            <ModalHeader
              toggle={async () => {
                if (JSON.stringify(values) === JSON.stringify(currentTreatment)) return onClose();
                setModalConfirmState({
                  open: true,
                  options: {
                    title: 'Voulez-vous enregistrer vos modifications ?',
                    buttons: [
                      {
                        text: 'Annuler',
                        style: 'cancel',
                      },
                      {
                        text: 'Non',
                        style: 'danger',
                        onClick: onClose,
                      },
                      {
                        text: 'Oui',
                        onClick: handleSubmit,
                      },
                    ],
                  },
                });
              }}>
              {isNewTreatment ? 'Ajouter un traitement' : currentTreatment?.name}
            </ModalHeader>
            <ModalBody>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="medicine-name">Nom</Label>
                    <Input placeholder="Amoxicilline" name="name" id="medicine-name" value={values.name} onChange={handleChange} />
                    {touched.name && errors.name && <span className="tw-text-xs tw-text-red-500">{errors.name}</span>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input placeholder="1mg" name="dosage" id="dosage" value={values.dosage} onChange={handleChange} />
                    {touched.dosage && errors.dosage && <span className="tw-text-xs tw-text-red-500">{errors.dosage}</span>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="frequency">Fréquence</Label>
                    <Input placeholder="1 fois par jour" name="frequency" id="frequency" value={values.frequency} onChange={handleChange} />
                    {touched.frequency && errors.frequency && <span className="tw-text-xs tw-text-red-500">{errors.frequency}</span>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="indication">Indication</Label>
                    <Input placeholder="Angine" name="indication" id="indication" value={values.indication} onChange={handleChange} />
                    {touched.indication && errors.indication && <span className="tw-text-xs tw-text-red-500">{errors.indication}</span>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="startDate">Date de début</Label>
                    <div>
                      <DatePicker id="startDate" defaultValue={values.startDate} onChange={handleChange} />
                    </div>
                    {touched.startDate && errors.startDate && <span className="tw-text-xs tw-text-red-500">{errors.startDate}</span>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <div>
                      <DatePicker id="endDate" defaultValue={values.endDate} onChange={handleChange} />
                    </div>
                    {touched.endDate && errors.endDate && <span className="tw-text-xs tw-text-red-500">{errors.endDate}</span>}
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <Documents
                    title="Documents"
                    personId={person._id}
                    documents={values.documents || []}
                    onAdd={async (docResponse) => {
                      const { data: file, encryptedEntityKey } = docResponse;
                      handleChange({
                        currentTarget: {
                          value: [
                            ...(values.documents || []),
                            {
                              _id: file.filename,
                              name: file.originalname,
                              encryptedEntityKey,
                              createdAt: new Date(),
                              createdBy: user._id,
                              downloadPath: `/person/${person._id}/document/${file.filename}`,
                              file,
                            },
                          ],
                          name: 'documents',
                        },
                      });
                    }}
                    onDelete={async (document) => {
                      handleChange({
                        currentTarget: {
                          value: values.documents.filter((d) => d._id !== document._id),
                          name: 'documents',
                        },
                      });
                    }}
                  />
                </Col>
              </Row>
              <br />
              <div className="tw-mt-4 tw-flex tw-justify-end">
                <ButtonCustom
                  type="submit"
                  disabled={isSubmitting || JSON.stringify(values) === JSON.stringify(currentTreatment)}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </div>
            </ModalBody>
          </React.Fragment>
        )}
      </Formik>
    </Modal>
  );
}
