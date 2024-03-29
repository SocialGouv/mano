import { useState, useMemo, useEffect, useRef } from 'react';
import DatePicker from './DatePicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { useLocation, useHistory } from 'react-router-dom';
import { CANCEL, DONE, TODO } from '../recoil/actions';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import {
  consultationsFieldsIncludingCustomFieldsSelector,
  consultationsState,
  defaultConsultationFields,
  prepareConsultationForEncryption,
} from '../recoil/consultations';
import API from '../services/api';
import { dayjsInstance } from '../services/date';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import CustomFieldInput from './CustomFieldInput';
import { modalConfirmState } from './ModalConfirm';
import SelectAsInput from './SelectAsInput';
import SelectStatus from './SelectStatus';
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from './tailwind/Modal';
import SelectPerson from './SelectPerson';
import { CommentsModule } from './CommentsGeneric';
import SelectTeamMultiple from './SelectTeamMultiple';
import UserName from './UserName';
import PersonName from './PersonName';
import TagTeam from './TagTeam';
import CustomFieldDisplay from './CustomFieldDisplay';
import { itemsGroupedByConsultationSelector } from '../recoil/selectors';
import { DocumentsModule } from './DocumentsGeneric';
import TabsNav from './tailwind/TabsNav';
import { useDataLoader } from './DataLoader';

export default function ConsultationModal() {
  const consultationsObjects = useRecoilValue(itemsGroupedByConsultationSelector);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentConsultationId = searchParams.get('consultationId');
  const newConsultation = searchParams.get('newConsultation');
  const currentConsultation = useMemo(() => {
    if (!currentConsultationId) return null;
    return consultationsObjects[currentConsultationId];
  }, [currentConsultationId, consultationsObjects]);
  const personId = searchParams.get('personId');
  const date = searchParams.get('dueAt') || searchParams.get('completedAt');

  const [open, setOpen] = useState(false);
  const consultationIdRef = useRef(currentConsultationId);
  const newConsultationRef = useRef(newConsultation);
  useEffect(() => {
    if (consultationIdRef.current !== currentConsultationId) {
      consultationIdRef.current = currentConsultationId;
      setOpen(!!currentConsultationId);
    }
    if (newConsultationRef.current !== newConsultation) {
      newConsultationRef.current = newConsultation;
      setOpen(!!newConsultation);
    }
  }, [newConsultation, currentConsultationId]);

  const manualCloseRef = useRef(false);
  const onAfterLeave = () => {
    if (manualCloseRef.current) history.goBack();
    manualCloseRef.current = false;
  };

  return (
    <ModalContainer open={open} size="full" onAfterLeave={onAfterLeave}>
      <ConsultationContent
        key={open}
        personId={personId}
        consultation={currentConsultation}
        date={date}
        onClose={() => {
          manualCloseRef.current = true;
          setOpen(false);
        }}
      />
    </ModalContainer>
  );
}

const newConsultationInitialState = (organisationId, personId, userId, date, teams) => ({
  _id: null,
  dueAt: date ? new Date(date) : new Date(),
  completedAt: new Date(),
  name: '',
  type: '',
  status: TODO,
  teams: teams.length === 1 ? [teams[0]._id] : [],
  user: userId,
  person: personId || null,
  organisation: organisationId,
  onlyVisibleBy: [],
  documents: [],
  comments: [],
  history: [],
  createdAt: new Date(),
});

function ConsultationContent({ personId, consultation, date, onClose }) {
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();
  const consultationsFieldsIncludingCustomFields = useRecoilValue(consultationsFieldsIncludingCustomFieldsSelector);
  const { refresh } = useDataLoader();

  const newConsultationInitialStateRef = useRef(newConsultationInitialState(organisation._id, personId, user._id, date, teams));

  const [isEditing, setIsEditing] = useState(!consultation);

  const initialState = useMemo(() => {
    if (consultation) {
      return {
        documents: [],
        comments: [],
        history: [],
        teams: consultation.teams ?? teams.length === 1 ? [teams[0]._id] : [],
        ...consultation,
      };
    }
    return newConsultationInitialStateRef.current;
  }, [consultation, teams]);

  const [data, setData] = useState(initialState);

  const isNewConsultation = !data._id;

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const [activeTab, setActiveTab] = useState('Informations');

  async function handleSubmit({ newData = {}, closeOnSubmit = false } = {}) {
    const body = { ...data, ...newData };
    if (!body.type) {
      toast.error('Veuillez choisir un type de consultation');
      return false;
    }
    if (!body.dueAt) {
      toast.error('Vous devez préciser une date prévue');
      return false;
    }
    if (!body.person) {
      toast.error('Veuillez sélectionner une personne suivie');
      return false;
    }
    if (!body.teams.length) {
      toast.error('Veuillez sélectionner au moins une équipe');
      return false;
    }
    if ([DONE, CANCEL].includes(body.status)) {
      body.completedAt = body.completedAt || new Date();
    } else {
      body.completedAt = null;
    }

    if (!isNewConsultation && !!consultation) {
      const historyEntry = {
        date: new Date(),
        user: user._id,
        data: {},
      };
      for (const key in body) {
        if (!consultationsFieldsIncludingCustomFields.map((field) => field.name).includes(key)) continue;
        if (body[key] !== consultation[key]) historyEntry.data[key] = { oldValue: consultation[key], newValue: body[key] };
      }
      if (!!Object.keys(historyEntry.data).length) body.history = [...(consultation.history || []), historyEntry];
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
    if (!consultationResponse.ok) return false;
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
    if (closeOnSubmit) onClose();
    refresh();
    return true;
  }

  const canSave = useMemo(() => {
    if (data.status !== initialState.status) return true;
    if (JSON.stringify(data.onlyVisibleBy) !== JSON.stringify(initialState.onlyVisibleBy)) return true;
    if (JSON.stringify(data.completedAt) !== JSON.stringify(initialState.completedAt)) return true;
    return false;
  }, [data, initialState]);

  // const canEdit = useMemo(() => !consultation || consultation.user === user._id, [consultation, user._id]);
  const canEdit = true;

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
    setIsEditing(true);
  };

  return (
    <>
      <ModalHeader
        title={
          <>
            {isNewConsultation && 'Ajouter une consultation'}
            {!isNewConsultation && !isEditing && 'Consultation'}
            {!isNewConsultation && isEditing && 'Modifier la consultation'}
            {!isNewConsultation && consultation?.user && (
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
        <div className="tw-flex tw-h-full tw-w-full tw-flex-col">
          <TabsNav
            className="tw-px-3 tw-py-2"
            tabs={[
              'Informations',
              `Documents ${data?.documents?.length ? `(${data.documents.length})` : ''}`,
              `Commentaires ${data?.comments?.length ? `(${data.comments.length})` : ''}`,
              'Historique',
            ]}
            onClick={(tab) => {
              if (tab.includes('Informations')) setActiveTab('Informations');
              if (tab.includes('Documents')) setActiveTab('Documents');
              if (tab.includes('Commentaires')) setActiveTab('Commentaires');
              if (tab.includes('Historique')) setActiveTab('Historique');
              refresh();
            }}
            activeTabIndex={['Informations', 'Documents', 'Commentaires', 'Historique'].findIndex((tab) => tab === activeTab)}
          />
          <form
            id="add-consultation-form"
            className={['tw-flex tw-h-[90vh] tw-w-full tw-flex-wrap tw-p-4', activeTab !== 'Informations' && 'tw-hidden'].filter(Boolean).join(' ')}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit({ closeOnSubmit: true });
            }}>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-team">
                Personne suivie
              </label>
              {isEditing ? (
                <SelectPerson noLabel value={data.person} onChange={handleChange} isMulti={false} inputId="create-consultation-person-select" />
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
                <input className="tailwindui" id="create-consultation-name" name="name" value={data.name} onChange={handleChange} />
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
                  onChange={handleChange}
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
                    <div data-test-id={field.label} key={field.name} className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
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
                    handleChange={handleChange}
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
                  onChange={handleChange}
                  inputId="new-consultation-select-status"
                  classNamePrefix="new-consultation-select-status"
                />
              ) : (
                <CustomFieldDisplay type="text" value={data.status} />
              )}
            </div>
            <div className="tw-basis-1/2 tw-px-4 tw-py-2">
              <label className={canEdit ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-dueat">
                Date prévue
              </label>
              <div>
                {canEdit ? (
                  <DatePicker withTime id="create-consultation-dueat" name="dueAt" defaultValue={data.dueAt ?? new Date()} onChange={handleChange} />
                ) : (
                  <CustomFieldDisplay type="date-with-time" value={data.dueAt} />
                )}
              </div>
            </div>

            <div className={['tw-basis-1/2 tw-px-4 tw-py-2', [DONE, CANCEL].includes(data.status) ? 'tw-visible' : 'tw-invisible'].join(' ')} />
            <div className={['tw-basis-1/2 tw-px-4 tw-py-2', [DONE, CANCEL].includes(data.status) ? 'tw-visible' : 'tw-invisible'].join(' ')}>
              <label className={canEdit ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-completedAt">
                Date réalisée
              </label>
              <div>
                {canEdit ? (
                  <DatePicker
                    withTime
                    id="create-consultation-completedAt"
                    name="completedAt"
                    defaultValue={data.completedAt ?? new Date()}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomFieldDisplay type="date-with-time" value={data.completedAt} />
                )}
              </div>
            </div>
          </form>
          <div
            className={['tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto', activeTab !== 'Documents' && 'tw-hidden']
              .filter(Boolean)
              .join(' ')}>
            <DocumentsModule
              personId={data.person}
              color="blue-900"
              showAssociatedItem={false}
              documents={data.documents.map((doc) => ({
                ...doc,
                type: doc.type ?? 'document', // or 'folder'
                linkedItem: { _id: consultation?._id, type: 'consultation' },
              }))}
              onAddDocuments={async (nextDocuments) => {
                const newData = {
                  ...data,
                  documents: [...data.documents, ...nextDocuments],
                };
                setData(newData);
                const ok = await handleSubmit({ newData });
                if (ok && nextDocuments.length > 1) toast.success('Documents ajoutés');
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
            className={['tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto', activeTab !== 'Commentaires' && 'tw-hidden']
              .filter(Boolean)
              .join(' ')}>
            <CommentsModule
              comments={data.comments.map((c) => ({ ...c, type: 'consultation', consultation }))}
              color="blue-900"
              typeForNewComment="consultation"
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
          <div
            className={['tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto', activeTab !== 'Historique' && 'tw-hidden']
              .filter(Boolean)
              .join(' ')}>
            <ConsultationHistory consultation={consultation} />
          </div>
        </div>
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
        {(isEditing || canSave) && (
          <button
            title="Sauvegarder cette consultation"
            type="submit"
            className="button-submit !tw-bg-blue-900"
            form="add-consultation-form"
            disabled={!canEdit}>
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <button
            title="Modifier cette consultation - seul le créateur peut modifier une consultation"
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

function ConsultationHistory({ consultation }) {
  const history = useMemo(() => [...(consultation?.history || [])].reverse(), [consultation?.history]);
  const teams = useRecoilValue(teamsState);
  const consultationsFieldsIncludingCustomFields = useRecoilValue(consultationsFieldsIncludingCustomFieldsSelector);

  return (
    <div>
      <table className="table table-striped table-bordered">
        <thead>
          <tr className="tw-cursor-default">
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Donnée</th>
          </tr>
        </thead>
        <tbody className="small">
          {history.map((h) => {
            return (
              <tr key={h.date} className="tw-cursor-default">
                <td>{dayjsInstance(h.date).format('DD/MM/YYYY HH:mm')}</td>
                <td>
                  <UserName id={h.user} />
                </td>
                <td className="tw-max-w-prose">
                  {Object.entries(h.data).map(([key, value]) => {
                    const consultationField = consultationsFieldsIncludingCustomFields.find((f) => f.name === key);

                    if (key === 'teams') {
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>{consultationField?.label} : </span>
                          <code>"{(value.oldValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(', ')}"</code>
                          <span>↓</span>
                          <code>"{(value.newValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(', ')}"</code>
                        </p>
                      );
                    }

                    if (key === 'onlyVisibleBy') {
                      return (
                        <p key={key}>
                          {consultationField?.label} : <br />
                          <code>{value.oldValue.length ? 'Oui' : 'Non'}</code> ➔ <code>{value.newValue.length ? 'Oui' : 'Non'}</code>
                        </p>
                      );
                    }

                    if (key === 'person') {
                      return (
                        <p key={key}>
                          {consultationField?.label} : <br />
                          <code>
                            <PersonName item={{ person: value.oldValue }} />
                          </code>{' '}
                          ➔{' '}
                          <code>
                            <PersonName item={{ person: value.newValue }} />
                          </code>
                        </p>
                      );
                    }

                    return (
                      <p
                        key={key}
                        data-test-id={`${consultationField?.label}: ${JSON.stringify(value.oldValue || '')} ➔ ${JSON.stringify(value.newValue)}`}>
                        {consultationField?.label} : <br />
                        <code>{JSON.stringify(value.oldValue || '')}</code> ➔ <code>{JSON.stringify(value.newValue)}</code>
                      </p>
                    );
                  })}
                </td>
              </tr>
            );
          })}
          {consultation?.createdAt && (
            <tr key={consultation.createdAt} className="tw-cursor-default">
              <td>{dayjsInstance(consultation.createdAt).format('DD/MM/YYYY HH:mm')}</td>
              <td>
                <UserName id={consultation.user} />
              </td>
              <td className="tw-max-w-prose">
                <p>Création de la consultation</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
