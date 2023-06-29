import { useState, useMemo, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { CANCEL, DONE, TODO } from '../recoil/actions';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import { consultationsState, defaultConsultationFields, prepareConsultationForEncryption } from '../recoil/consultations';
import API from '../services/api';
import { dateForDatePicker, dayjsInstance } from '../services/date';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import CustomFieldInput from './CustomFieldInput';
import Documents from './Documents';
import { modalConfirmState } from './ModalConfirm';
import SelectAsInput from './SelectAsInput';
import SelectStatus from './SelectStatus';
import { toast } from 'react-toastify';
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from './tailwind/Modal';
import SelectPerson from './SelectPerson';
import { CommentsModule } from './CommentsGeneric';
import SelectTeamMultiple from './SelectTeamMultiple';
import UserName from './UserName';
import PersonName from './PersonName';
import TagTeam from './TagTeam';
import CustomFieldDisplay from './CustomFieldDisplay';

export default function ConsultationModal({ open, onClose, personId, consultation, date }) {
  return (
    <ModalContainer open={open} size="3xl">
      <ConsultationContent key={open} personId={personId} consultation={consultation} date={date} onClose={onClose} />
    </ModalContainer>
  );
}

function ConsultationContent({ personId, consultation, date, onClose }) {
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const [isEditing, setIsEditing] = useState(!consultation);

  const initialState = useMemo(() => {
    if (consultation) {
      return {
        documents: [],
        comments: [],
        teams: consultation.teams ?? teams.length === 1 ? [teams[0]._id] : [],
        ...consultation,
      };
    }
    return {
      _id: null,
      dueAt: date ? new Date(date) : new Date(),
      completedAt: new Date(),
      name: '',
      type: '',
      status: TODO,
      teams: teams.length === 1 ? [teams[0]._id] : [],
      user: user._id,
      person: personId || null,
      organisation: organisation._id,
      onlyVisibleBy: [],
      documents: [],
      comments: [],
      createdAt: new Date(),
    };
  }, [organisation._id, personId, user._id, consultation, date, teams]);

  const [data, setData] = useState(initialState);

  const isNewConsultation = !data._id;

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const [activeTab, setActiveTab] = useState('Informations');

  async function handleSubmit({ newData = {}, closeOnSubmit = false } = {}) {
    const body = { ...data, ...newData };
    if (!body.type) {
      return toast.error('Veuillez choisir un type de consultation');
    }
    if (!body.dueAt) {
      return toast.error('Vous devez préciser une date prévue');
    }
    if (!body.person) {
      return toast.error('Veuillez sélectionner une personne suivie');
    }
    if (!body.teams.length) {
      return toast.error('Veuillez sélectionner au moins une équipe');
    }
    if ([DONE, CANCEL].includes(body.status)) {
      body.completedAt = body.completedAt || new Date();
    } else {
      body.completedAt = null;
    }
    const consultationResponse = isNewConsultation
      ? await API.post({
          path: '/consultation',
          body: prepareConsultationForEncryption(organisation.consultations)(body),
        })
      : await API.put({
          path: `/consultation/${data._id}`,
          body: prepareConsultationForEncryption(organisation.consultations)(body),
        });
    if (!consultationResponse.ok) return onClose();
    setData(consultationResponse.decryptedData);
    const consult = { ...consultationResponse.decryptedData, ...defaultConsultationFields };
    if (isNewConsultation) {
      setAllConsultations((all) => [...all, consult].sort((a, b) => new Date(b.dueAt) - new Date(a.dueAt)));
    } else {
      setAllConsultations((all) =>
        all
          .map((c) => {
            if (c._id === body._id) return consult;
            return c;
          })
          .sort((a, b) => new Date(b.dueAt) - new Date(a.dueAt))
      );
    }
    const { createdAt, completedAt } = consultationResponse.decryptedData;
    await createReportAtDateIfNotExist(createdAt);
    if (!!completedAt) {
      if (dayjsInstance(completedAt).format('YYYY-MM-DD') !== dayjsInstance(createdAt).format('YYYY-MM-DD')) {
        await createReportAtDateIfNotExist(completedAt);
      }
    }
    if (closeOnSubmit) return onClose();
  }

  const canSave = useMemo(() => {
    if (data.status !== initialState.status) return true;
    if (JSON.stringify(data.onlyVisibleBy) !== JSON.stringify(initialState.onlyVisibleBy)) return true;
    if (JSON.stringify(data.completedAt) !== JSON.stringify(initialState.completedAt)) return true;
    return false;
  }, [data, initialState]);

  const canEdit = useMemo(() => !consultation || consultation.user === user._id, [consultation, user._id]);

  return (
    <>
      <ModalHeader
        title={
          <>
            {isNewConsultation && 'Ajouter une consultation'}
            {!isNewConsultation && !isEditing && 'Consultation'}
            {!isNewConsultation && isEditing && 'Modifier la consultation'}
            {!isNewConsultation && consultation.user && (
              <UserName
                className="tw-block tw-text-right tw-text-base tw-font-normal tw-italic"
                id={consultation.user}
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
              title: 'Quitter la consultation sans enregistrer ?',
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
        <form
          id="add-consultation-form"
          className="tw-flex tw-h-full tw-w-full tw-flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit({ closeOnSubmit: true });
          }}>
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
          <div className={['tw-flex tw-w-full tw-flex-wrap tw-p-4', activeTab !== 'Informations' ? 'tw-hidden' : ''].join(' ')}>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-team">
                Personne suivie
              </label>
              {isEditing ? (
                <SelectPerson
                  noLabel
                  value={data.person}
                  onChange={(e) => {
                    setData({ ...data, person: e.currentTarget.value });
                  }}
                  isMulti={false}
                  inputId="create-consultation-person-select"
                />
              ) : (
                <PersonName item={data} />
              )}
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-team">
                Équipe(s) en charge
              </label>
              {isEditing ? (
                <SelectTeamMultiple
                  onChange={(teamIds) => setData({ ...data, teams: teamIds })}
                  value={data.teams}
                  colored
                  inputId="create-consultation-team-select"
                  classNamePrefix="create-consultation-team-select"
                />
              ) : (
                <div className="tw-flex tw-flex-col">
                  {data.teams.map((teamId) => (
                    <TagTeam key={teamId} teamId={teamId} />
                  ))}
                </div>
              )}
            </div>

            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-name">
                Nom (facultatif)
              </label>
              {isEditing ? (
                <input
                  className="form-text tailwindui"
                  id="create-consultation-name"
                  name="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.currentTarget.value })}
                />
              ) : (
                <CustomFieldDisplay type="text" value={data.name} />
              )}
            </div>

            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="type">
                Type
              </label>
              {isEditing ? (
                <SelectAsInput
                  id="type"
                  name="type"
                  inputId="consultation-modal-type"
                  classNamePrefix="consultation-modal-type"
                  value={data.type}
                  onChange={(e) => {
                    setData({ ...data, type: e.currentTarget.value });
                  }}
                  placeholder="-- Type de consultation --"
                  options={organisation.consultations.map((e) => e.name)}
                />
              ) : (
                <CustomFieldDisplay type="text" value={data.type} />
              )}
            </div>
            {organisation.consultations
              .find((e) => e.name === data.type)
              ?.fields.filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
              .map((field) => {
                if (!isEditing) {
                  return (
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <label className="tw-text-sm tw-font-semibold tw-text-blue-900" htmlFor="type">
                        {field.label}
                      </label>
                      <CustomFieldDisplay key={field.name} type={field.type} value={data[field.name]} />
                    </div>
                  );
                }
                return (
                  <CustomFieldInput
                    colWidth={field.type === 'textarea' ? 12 : 6}
                    model="person"
                    values={data}
                    handleChange={(e) => {
                      setData({ ...data, [(e.currentTarget || e.target).name]: (e.currentTarget || e.target).value });
                    }}
                    field={field}
                    key={field.name}
                  />
                );
              })}
            {data.user === user._id && (
              <>
                <hr className="tw-basis-full" />
                <div className="tw-basis-full tw-p-4">
                  <label htmlFor="create-consultation-onlyme">
                    <input
                      type="checkbox"
                      id="create-consultation-onlyme"
                      style={{ marginRight: '0.5rem' }}
                      name="onlyVisibleByCreator"
                      checked={data.onlyVisibleBy?.includes(user._id)}
                      onChange={() => {
                        setData({ ...data, onlyVisibleBy: data.onlyVisibleBy?.includes(user._id) ? [] : [user._id] });
                      }}
                    />
                    Seulement visible par moi
                  </label>
                </div>
              </>
            )}
            <hr className="tw-basis-full" />
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className={canEdit ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="new-consultation-select-status">
                Statut
              </label>
              {canEdit ? (
                <SelectStatus
                  name="status"
                  value={data.status || ''}
                  onChange={(e) => {
                    setData({ ...data, status: e.target.value });
                  }}
                  inputId="new-consultation-select-status"
                  classNamePrefix="new-consultation-select-status"
                />
              ) : (
                <CustomFieldDisplay type="text" value={data.status} />
              )}
            </div>
            <div className="tw-basis-1/2 tw-p-4">
              <label className={canEdit ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-dueat">
                Date prévue
              </label>
              <div>
                {canEdit ? (
                  <ReactDatePicker
                    locale="fr"
                    className="form-control"
                    id="create-consultation-dueat"
                    selected={dateForDatePicker(data.dueAt)}
                    onChange={(dueAt) => {
                      setData({ ...data, dueAt });
                    }}
                    timeInputLabel="Heure :"
                    dateFormat={'dd/MM/yyyy HH:mm'}
                    showTimeInput
                  />
                ) : (
                  <CustomFieldDisplay type="date-with-time" value={data.dueAt} />
                )}
              </div>
            </div>

            <div className={['tw-basis-1/2 tw-p-4', [DONE, CANCEL].includes(data.status) ? 'tw-visible' : 'tw-invisible'].join(' ')} />
            <div className={['tw-basis-1/2 tw-p-4', [DONE, CANCEL].includes(data.status) ? 'tw-visible' : 'tw-invisible'].join(' ')}>
              <label className={canEdit ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-completedAt">
                Date réalisée
              </label>
              <div>
                {canEdit ? (
                  <ReactDatePicker
                    locale="fr"
                    className="form-control"
                    id="create-consultation-completedAt"
                    selected={dateForDatePicker(data.completedAt || dayjsInstance())}
                    onChange={(completedAt) => {
                      setData({ ...data, completedAt });
                    }}
                    timeInputLabel="Heure :"
                    dateFormat={'dd/MM/yyyy HH:mm'}
                    showTimeInput
                  />
                ) : (
                  <CustomFieldDisplay type="date-with-time" value={data.completedAt} />
                )}
              </div>
            </div>
          </div>
          <div className={['tw-flex tw-min-h-1/2 tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Documents' ? 'tw-hidden' : ''].join(' ')}>
            {data.person && (
              <Documents
                personId={data.person}
                color="blue-900"
                documents={data.documents}
                onAdd={async (docResponse) => {
                  const { data: file, encryptedEntityKey } = docResponse;
                  const newData = {
                    ...data,
                    documents: [
                      ...data.documents,
                      {
                        _id: file.filename,
                        name: file.originalname,
                        encryptedEntityKey,
                        createdAt: new Date(),
                        createdBy: user._id,
                        downloadPath: `/person/${data.person}/document/${file.filename}`,
                        file,
                      },
                    ],
                  };
                  setData(newData);
                  handleSubmit({ newData });
                }}
                onDelete={async (document) => {
                  const newData = { ...data, documents: data.documents.filter((d) => d._id !== document._id) };
                  setData(newData);
                  handleSubmit({ newData });
                }}
              />
            )}
          </div>
          <div className={['tw-flex tw-min-h-1/2 tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Commentaires' ? 'tw-hidden' : ''].join(' ')}>
            <CommentsModule
              comments={data.comments.map((c) => ({ ...c, type: 'consultation', consultation }))}
              color="blue-900"
              typeForNewComment="consultation"
              onDeleteComment={(comment) => {
                const newData = { ...data, comments: data.comments.filter((c) => c._id !== comment._id) };
                setData(newData);
                handleSubmit({ newData });
              }}
              onSubmitComment={(comment, isNewComment) => {
                const newData = isNewComment
                  ? { ...data, comments: [{ ...comment, _id: uuidv4() }, ...data.comments] }
                  : { ...data, comments: data.comments.map((c) => (c._id === comment._id ? comment : c)) };
                setData(newData);
                handleSubmit({ newData });
              }}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button name="Fermer" type="button" className="button-cancel" onClick={() => onClose()}>
          Fermer
        </button>
        {!isNewConsultation && !!isEditing && (
          <button
            type="button"
            name="cancel"
            disabled={!canEdit}
            title="Supprimer cette consultation - seul le créateur peut supprimer une consultation"
            className="button-destructive"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm('Voulez-vous supprimer cette consultation ?')) return;
              const response = await API.delete({ path: `/consultation/${consultation._id}` });
              if (!response.ok) return;
              setAllConsultations((all) => all.filter((t) => t._id !== consultation._id));
              toast.success('Consultation supprimée !');
              onClose();
            }}>
            Supprimer
          </button>
        )}
        {isEditing || canSave ? (
          <button
            title="Sauvegarder cette consultation"
            type="submit"
            className="button-submit !tw-bg-blue-900"
            form="add-consultation-form"
            disabled={!canEdit}>
            Sauvegarder
          </button>
        ) : (
          <button
            title="Modifier cette consultation - seul le créateur peut modifier une consultation"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className="button-submit !tw-bg-blue-900"
            disabled={!canEdit}>
            Modifier
          </button>
        )}
      </ModalFooter>
    </>
  );
}
