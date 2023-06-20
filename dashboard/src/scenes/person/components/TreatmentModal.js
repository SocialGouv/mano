import React, { useMemo, useState } from 'react';
import { Input, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { organisationState, userState } from '../../../recoil/auth';
import { outOfBoundariesDate } from '../../../services/date';
import API from '../../../services/api';
import Documents from '../../../components/Documents';
import { prepareTreatmentForEncryption, treatmentsState } from '../../../recoil/treatments';
import DatePicker from '../../../components/DatePicker';
import { CommentsModule } from '../../../components/CommentsGeneric';
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';

/**
 * @param {Object} props
 * @param {Function} props.onClose
 * @param {Boolean} props.isNewTreatment
 * @param {Object} props.treatment
 * @param {Object} props.person
 */
export default function TreatmentModal({ onClose, isNewTreatment, treatment, person }) {
  const setAllTreatments = useSetRecoilState(treatmentsState);
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
        documents: [],
        comments: [],
      };
    }
    return {
      documents: [],
      comments: [],
      ...treatment,
    };
  }, [isNewTreatment, treatment, user, person, organisation]);
  const [activeTab, setActiveTab] = useState('Informations');

  return (
    <ModalContainer open={true} onClose={onClose} size="3xl">
      <Formik
        enableReinitialize
        initialValues={currentTreatment}
        validate={(values) => {
          const errors = {};
          if (!values._id) errors._id = "L'identifiant est obligatoire";
          if (!values.name) errors.name = 'Le nom est obligatoire';
          // if (!values.dosage) errors.dosage = 'Le dosage est obligatoire';
          // if (!values.frequency) errors.frequency = 'La fréquence est obligatoire';
          // if (!values.indication) errors.indication = "L'indication est obligatoire";
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
            <ModalHeader title={isNewTreatment ? 'Ajouter un traitement' : currentTreatment?.name}></ModalHeader>
            <ModalBody>
              <div className="tw-flex tw-h-full tw-w-full tw-flex-col"></div>
              <ul className="noprint tw-mb-5 tw-mt-4 tw-flex tw-list-none tw-flex-wrap tw-border-b tw-border-zinc-200 tw-px-2">
                <li className="tw-cursor-pointer">
                  <button
                    type="button"
                    className={[
                      '-tw-mb-px tw-block tw-rounded-t-md tw-border tw-border-transparent tw-py-2 tw-px-4',
                      activeTab !== 'Informations' && 'tw-text-main75',
                      activeTab === 'Informations' && 'tw-border-x-zinc-200 tw-border-t-zinc-200 tw-bg-white',
                    ].join(' ')}
                    onClick={() => setActiveTab('Informations')}>
                    Informations
                  </button>
                </li>
                <li className="tw-cursor-pointer">
                  <button
                    type="button"
                    className={[
                      '-tw-mb-px tw-block tw-rounded-t-md tw-border tw-border-transparent tw-py-2 tw-px-4',
                      activeTab !== 'Documents' && 'tw-text-main75',
                      activeTab === 'Documents' && 'tw-border-x-zinc-200 tw-border-t-zinc-200 tw-bg-white',
                    ].join(' ')}
                    onClick={() => setActiveTab('Documents')}>
                    Documents {values?.documents?.length ? `(${values.documents.length})` : ''}
                  </button>
                </li>
                <li className="tw-cursor-pointer">
                  <button
                    type="button"
                    className={[
                      '-tw-mb-px tw-block tw-rounded-t-md tw-border tw-border-transparent tw-py-2 tw-px-4',
                      activeTab !== 'Commentaires' && 'tw-text-main75',
                      activeTab === 'Commentaires' && 'tw-border-x-zinc-200 tw-border-t-zinc-200 tw-bg-white',
                    ].join(' ')}
                    onClick={() => setActiveTab('Commentaires')}>
                    Commentaires {values?.comments?.length ? `(${values.comments.length})` : ''}
                  </button>
                </li>
              </ul>
              <div className={['tw-min-h-screen tw-w-full', activeTab !== 'Informations' ? 'tw-hidden' : ''].join(' ')}>
                <div className="tw-flex tw-w-full tw-flex-wrap">
                  <div className="tw-basis-1/2 tw-p-4">
                    <Label htmlFor="medicine-name">Nom</Label>
                    <Input placeholder="Amoxicilline" name="name" id="medicine-name" value={values.name} onChange={handleChange} />
                    {touched.name && errors.name && <span className="tw-text-xs tw-text-red-500">{errors.name}</span>}
                  </div>
                  <div className="tw-basis-1/2 tw-p-4">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input placeholder="1mg" name="dosage" id="dosage" value={values.dosage} onChange={handleChange} />
                    {touched.dosage && errors.dosage && <span className="tw-text-xs tw-text-red-500">{errors.dosage}</span>}
                  </div>
                  <div className="tw-basis-1/2 tw-p-4">
                    <Label htmlFor="frequency">Fréquence</Label>
                    <Input placeholder="1 fois par jour" name="frequency" id="frequency" value={values.frequency} onChange={handleChange} />
                    {touched.frequency && errors.frequency && <span className="tw-text-xs tw-text-red-500">{errors.frequency}</span>}
                  </div>
                  <div className="tw-basis-1/2 tw-p-4">
                    <Label htmlFor="indication">Indication</Label>
                    <Input placeholder="Angine" name="indication" id="indication" value={values.indication} onChange={handleChange} />
                    {touched.indication && errors.indication && <span className="tw-text-xs tw-text-red-500">{errors.indication}</span>}
                  </div>
                  <div className="tw-basis-1/2 tw-p-4">
                    <Label htmlFor="startDate">Date de début</Label>
                    <div>
                      <DatePicker id="startDate" defaultValue={values.startDate} onChange={handleChange} />
                    </div>
                    {touched.startDate && errors.startDate && <span className="tw-text-xs tw-text-red-500">{errors.startDate}</span>}
                  </div>
                  <div className="tw-basis-1/2 tw-p-4">
                    <Label htmlFor="endDate">Date de fin</Label>
                    <div>
                      <DatePicker id="endDate" defaultValue={values.endDate} onChange={handleChange} />
                    </div>
                    {touched.endDate && errors.endDate && <span className="tw-text-xs tw-text-red-500">{errors.endDate}</span>}
                  </div>
                </div>
              </div>
              <div
                className={['tw-flex tw-min-h-screen tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Documents' ? 'tw-hidden' : ''].join(
                  ' '
                )}>
                <Documents
                  title="Documents"
                  personId={person._id}
                  documents={values.documents}
                  onAdd={async (docResponse) => {
                    const { data: file, encryptedEntityKey } = docResponse;
                    handleChange({
                      currentTarget: {
                        value: [
                          ...values.documents,
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
              </div>
              <div
                className={['tw-flex tw-min-h-screen tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Commentaires' ? 'tw-hidden' : ''].join(
                  ' '
                )}>
                <CommentsModule
                  comments={values.comments}
                  typeForNewComment="treatment"
                  onDeleteComment={(comment) => {
                    handleChange({
                      currentTarget: {
                        value: values.comments.filter((c) => c._id !== comment._id),
                        name: 'comments',
                      },
                    });
                  }}
                  onSubmitComment={(comment, isNewComment) => {
                    handleChange({
                      currentTarget: {
                        value: isNewComment
                          ? [{ ...comment, _id: uuidv4() }, ...values.comments]
                          : values.comments.map((c) => (c._id === comment._id ? comment : c)),
                        name: 'comments',
                      },
                    });
                  }}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <button name="Annuler" type="button" className="button-cancel" onClick={() => onClose()}>
                Annuler
              </button>
              {!isNewTreatment && (
                <button
                  type="button"
                  name="cancel"
                  className="button-destructive"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm('Voulez-vous supprimer ce traitement ?')) return;
                    const response = await API.delete({ path: `/treatment/${treatment._id}` });
                    if (!response.ok) return;
                    setAllTreatments((all) => all.filter((t) => t._id !== treatment._id));
                    toast.success('Traitement supprimé !');
                    onClose();
                  }}>
                  Supprimer
                </button>
              )}
              <button
                className="button-submit"
                type="button"
                disabled={isSubmitting || JSON.stringify(values) === JSON.stringify(currentTreatment)}
                onClick={() => !isSubmitting && handleSubmit()}>
                {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </ModalFooter>
          </React.Fragment>
        )}
      </Formik>
    </ModalContainer>
  );
}
