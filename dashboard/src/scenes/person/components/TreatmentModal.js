import React, { useMemo, useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useHistory, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { organisationState, userState } from '../../../recoil/auth';
import { outOfBoundariesDate } from '../../../services/date';
import API from '../../../services/api';
import { prepareTreatmentForEncryption, treatmentsState } from '../../../recoil/treatments';
import DatePicker from '../../../components/DatePicker';
import { CommentsModule } from '../../../components/CommentsGeneric';
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { itemsGroupedByTreatmentSelector } from '../../../recoil/selectors';
import { modalConfirmState } from '../../../components/ModalConfirm';
import CustomFieldDisplay from '../../../components/CustomFieldDisplay';
import UserName from '../../../components/UserName';
import { DocumentsModule } from '../../../components/DocumentsGeneric';

export default function TreatmentModal() {
  const treatmentsObjects = useRecoilValue(itemsGroupedByTreatmentSelector);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTreatmentId = searchParams.get('treatmentId');
  const newTreatment = searchParams.get('newTreatment');
  const currentTreatment = useMemo(() => {
    if (!currentTreatmentId) return null;
    return treatmentsObjects[currentTreatmentId];
  }, [currentTreatmentId, treatmentsObjects]);
  const personId = searchParams.get('personId');

  const [open, setOpen] = useState(false);
  const consultationIdRef = useRef(currentTreatmentId);
  const newConsultationRef = useRef(newTreatment);
  useEffect(() => {
    if (consultationIdRef.current !== currentTreatmentId) {
      consultationIdRef.current = currentTreatmentId;
      setOpen(!!currentTreatmentId);
    }
    if (newConsultationRef.current !== newTreatment) {
      newConsultationRef.current = newTreatment;
      setOpen(!!newTreatment);
    }
  }, [newTreatment, currentTreatmentId]);

  const manualCloseRef = useRef(false);
  const onAfterLeave = () => {
    if (manualCloseRef.current) history.goBack();
    manualCloseRef.current = false;
  };

  return (
    <ModalContainer open={open} size="3xl" onAfterLeave={onAfterLeave}>
      <TreatmentContent
        key={open}
        personId={personId}
        treatment={currentTreatment}
        onClose={() => {
          manualCloseRef.current = true;
          setOpen(false);
        }}
      />
    </ModalContainer>
  );
}

/**
 * @param {Object} props
 * @param {Function} props.onClose
 * @param {Boolean} props.isNewTreatment
 * @param {Object} props.treatment
 * @param {Object} props.person
 */
function TreatmentContent({ onClose, treatment, personId }) {
  const setAllTreatments = useSetRecoilState(treatmentsState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);

  const initialState = useMemo(() => {
    if (!!treatment) {
      return {
        documents: [],
        comments: [],
        ...treatment,
      };
    }
    return {
      _id: null,
      startDate: new Date(),
      endDate: null,
      name: '',
      dosage: '',
      frequency: '',
      indication: '',
      user: user._id,
      person: personId,
      organisation: organisation._id,
      documents: [],
      comments: [],
    };
  }, [treatment, user, personId, organisation]);
  const [activeTab, setActiveTab] = useState('Informations');
  const [data, setData] = useState(initialState);
  const isNewTreatment = !data?._id;

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const canEdit = useMemo(() => !treatment || treatment.user === user._id, [treatment, user._id]);

  const [isEditing, setIsEditing] = useState(isNewTreatment);

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
  };

  async function handleSubmit({ newData = {}, closeOnSubmit = false } = {}) {
    const body = { ...data, ...newData };
    if (!body.name) {
      toast.error('Le nom est obligatoire');
      return false;
    }
    if (!body.startDate) {
      toast.error('La date de début est obligatoire');
      return false;
    }
    if (outOfBoundariesDate(body.startDate)) {
      toast.error('La date de début de traitement est hors limites (entre 1900 et 2100)');
      return false;
    }
    if (body.endDate && outOfBoundariesDate(body.endDate)) {
      toast.error('La date de fin de traitement est hors limites (entre 1900 et 2100)');
      return false;
    }
    const treatmentResponse = isNewTreatment
      ? await API.post({
          path: '/treatment',
          body: prepareTreatmentForEncryption(body),
        })
      : await API.put({
          path: `/treatment/${data._id}`,
          body: prepareTreatmentForEncryption({ ...body, user: data.user || user._id }),
        });
    if (!treatmentResponse.ok) {
      toast.error("Impossible d'enregistrer le traitement. Notez toutes les informations et contactez le support.");
      return false;
    }
    setData(treatmentResponse.decryptedData);
    if (isNewTreatment) {
      setAllTreatments((all) => [...all, treatmentResponse.decryptedData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
    } else {
      setAllTreatments((all) =>
        all
          .map((c) => {
            if (c._id === data._id) return treatmentResponse.decryptedData;
            return c;
          })
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      );
    }
    if (closeOnSubmit) onClose();
    return true;
  }

  return (
    <>
      <ModalHeader
        title={
          <>
            {isNewTreatment && 'Ajouter un traitement'}
            {!isNewTreatment && !isEditing && `Traitement: ${data?.name}`}
            {!isNewTreatment && isEditing && `Modifier le traitement: ${data?.name}`}
            {!isNewTreatment && treatment?.user && (
              <UserName
                className="tw-block tw-text-right tw-text-base tw-font-normal tw-italic"
                id={treatment.user}
                wrapper={(name) => ` (créée par ${name})`}
              />
            )}
          </>
        }
        onClose={() => {
          if (JSON.stringify(data) === JSON.stringify(initialState)) return onClose();
          setModalConfirmState({
            open: true,
            options: {
              title: 'Quitter le traitement sans enregistrer ?',
              subTitle: 'Toutes les modifications seront perdues.',
              buttons: [
                {
                  text: 'Annuler',
                  className: 'button-cancel',
                },
                {
                  text: 'Oui',
                  className: 'button-destructive',
                  onClick: () => onClose(),
                },
              ],
            },
          });
        }}
      />
      <ModalBody>
        <div>
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
                Documents {data?.documents?.length ? `(${data.documents.length})` : ''}
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
                Commentaires {data?.comments?.length ? `(${data.comments.length})` : ''}
              </button>
            </li>
          </ul>
          <form
            id="add-treatment-form"
            className={['tw-flex tw-h-[50vh] tw-w-full tw-flex-wrap tw-overflow-y-auto tw-p-4', activeTab !== 'Informations' && 'tw-hidden']
              .filter(Boolean)
              .join(' ')}
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = handleSubmit({ closeOnSubmit: true });
              if (ok && isNewTreatment) toast.success('Traitement créé !');
              if (ok && !isNewTreatment) toast.success('Traitement mis à jour !');
            }}>
            <div className="tw-flex tw-w-full tw-flex-wrap">
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="medicine-name">
                  Nom
                </label>
                {isEditing ? (
                  <input className="tailwindui" placeholder="Amoxicilline" name="name" id="medicine-name" value={data.name} onChange={handleChange} />
                ) : (
                  <CustomFieldDisplay value={data.name} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="dosage">
                  Dosage
                </label>
                {isEditing ? (
                  <input className="tailwindui" placeholder="1mg" name="dosage" id="dosage" value={data.dosage} onChange={handleChange} />
                ) : (
                  <CustomFieldDisplay value={data.dosage} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="frequency">
                  Fréquence
                </label>
                {isEditing ? (
                  <input
                    className="tailwindui"
                    placeholder="1 fois par jour"
                    name="frequency"
                    id="frequency"
                    value={data.frequency}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomFieldDisplay value={data.frequency} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="indication">
                  Indication
                </label>
                {isEditing ? (
                  <input
                    className="tailwindui"
                    placeholder="Angine"
                    name="indication"
                    id="indication"
                    value={data.indication}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomFieldDisplay value={data.indication} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="startDate">
                  Date de début
                </label>
                {isEditing ? (
                  <DatePicker id="startDate" name="startDate" defaultValue={data.startDate} onChange={handleChange} />
                ) : (
                  <CustomFieldDisplay value={data.startDate} type="date" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="endDate">
                  Date de fin
                </label>
                {isEditing ? (
                  <DatePicker id="endDate" name="endDate" defaultValue={data.endDate} onChange={handleChange} />
                ) : (
                  <CustomFieldDisplay value={data.endDate} type="date" />
                )}
              </div>
            </div>
          </form>
          <div
            className={[
              'tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-flex-wrap tw-gap-4 tw-overflow-y-auto',
              activeTab !== 'Documents' && 'tw-hidden',
            ]
              .filter(Boolean)
              .join(' ')}>
            <DocumentsModule
              personId={data.person}
              color="blue-900"
              showAssociatedItem={false}
              documents={data.documents.map((doc) => ({ ...doc, linkedItem: { item: treatment, type: 'treatment' } }))}
              onAddDocuments={async (nextDocuments) => {
                const newData = {
                  ...data,
                  documents: [...data.documents, ...nextDocuments],
                };
                setData(newData);
                const ok = await handleSubmit({ newData });
                if (ok) toast.success('Documents ajoutés');
              }}
              onDeleteDocument={async (document) => {
                const newData = { ...data, documents: data.documents.filter((d) => d._id !== document._id) };
                setData(newData);
                const ok = await handleSubmit({ newData });
                if (ok) toast.success('Document supprimé');
                return ok;
              }}
              onSubmitDocument={async (document) => {
                const newData = {
                  ...data,
                  documents: data.documents.map((d) => {
                    if (d._id === document._id) return document;
                    return d;
                  }),
                };
                setData(newData);
                const ok = await handleSubmit({ newData });
                if (ok) toast.success('Document mis à jour');
              }}
            />
          </div>
          <div
            className={[
              'tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-flex-wrap tw-gap-4 tw-overflow-y-auto',
              activeTab !== 'Commentaires' && 'tw-hidden',
            ]
              .filter(Boolean)
              .join(' ')}>
            <CommentsModule
              comments={data.comments.map((c) => ({ ...c, type: 'treatment', treatment }))}
              color="blue-900"
              typeForNewComment="treatment"
              onDeleteComment={async (comment) => {
                const newData = { ...data, comments: data.comments.filter((c) => c._id !== comment._id) };
                setData(newData);
                const ok = await handleSubmit({ newData });
                if (ok) toast.success('Commentaire supprimé');
              }}
              onSubmitComment={async (comment, isNewComment) => {
                const newData = isNewComment
                  ? { ...data, comments: [{ ...comment, _id: uuidv4() }, ...data.comments] }
                  : { ...data, comments: data.comments.map((c) => (c._id === comment._id ? comment : c)) };
                setData(newData);
                const ok = await handleSubmit({ newData });
                if (ok) toast.success('Commentaire enregistré');
              }}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button name="Fermer" type="button" className="button-cancel" onClick={() => onClose()}>
          Fermer
        </button>
        {!isNewTreatment && !!isEditing && (
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

        {isEditing && (
          <button
            title="Sauvegarder ce traitement"
            type="submit"
            className="button-submit !tw-bg-blue-900"
            form="add-treatment-form"
            disabled={!canEdit}>
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <button
            title="Modifier ce traitement - seul le créateur peut modifier un traitement"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className={['button-submit !tw-bg-blue-900', activeTab === 'Informations' ? 'tw-visible' : 'tw-invisible'].join(' ')}
            disabled={!canEdit}>
            Modifier
          </button>
        )}
      </ModalFooter>
    </>
  );
}
