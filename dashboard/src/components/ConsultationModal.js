import { useState, useMemo } from 'react';
import ReactDatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { CANCEL, DONE, TODO } from '../recoil/actions';
import { currentTeamState, organisationState, userState } from '../recoil/auth';
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

export default function ConsultationModal({ onClose, personId, consultation, date }) {
  const organisation = useRecoilValue(organisationState);
  const team = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const isNewConsultation = !consultation;
  const initialState = useMemo(() => {
    if (consultation) {
      return {
        documents: [],
        comments: [],
        ...consultation,
      };
    }
    return {
      _id: uuidv4(),
      dueAt: date ? new Date(date) : new Date(),
      completedAt: new Date(),
      name: '',
      type: '',
      status: TODO,
      user: user._id,
      person: personId || null,
      organisation: organisation._id,
      onlyVisibleBy: [],
      documents: [],
      comments: [],
      createdAt: new Date(),
    };
  }, [organisation._id, personId, user._id, consultation, date]);
  const [data, setData] = useState(initialState);
  const [activeTab, setActiveTab] = useState('Informations');

  async function handleSubmit() {
    const body = { ...data };
    if (!body.type) {
      return toast.error('Veuillez choisir un type de consultation');
    }
    if (!body.dueAt) {
      return toast.error('Vous devez préciser une date prévue');
    }
    if (!body.person) {
      return toast.error('Veuillez sélectionner une personne suivie');
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
          path: `/consultation/${initialState._id}`,
          body: prepareConsultationForEncryption(organisation.consultations)(body),
        });
    if (!consultationResponse.ok) return onClose();
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
    return onClose();
  }

  return (
    <ModalContainer
      open={true}
      size="3xl"
      onClose={() => {
        if (JSON.stringify(data) === JSON.stringify(initialState)) return onClose();
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
                onClick: () => onClose(),
              },
              {
                text: 'Oui',
                onClick: () => {
                  handleSubmit();
                },
              },
            ],
          },
        });
      }}>
      <ModalHeader title={consultation ? 'Modifier une consultation' : 'Ajouter une consultation'} />
      <ModalBody>
        <form
          id="add-consultation-form"
          className="tw-flex tw-h-full tw-w-full tw-flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
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
          <div
            className={['tw-flex tw-min-h-screen tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Informations' ? 'tw-hidden' : ''].join(' ')}>
            <div>
              {!personId && (
                <SelectPerson
                  value={data.person}
                  onChange={(e) => {
                    setData({ ...data, person: e.currentTarget.value });
                  }}
                  isMulti={false}
                  inputId="create-consultation-person-select"
                />
              )}
            </div>
            <div className="-tw-mx-4 tw-flex tw-flex-wrap">
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-p-4">
                <label htmlFor="create-consultation-name">Nom (facultatif)</label>
                <input
                  className="form-text tailwindui"
                  id="create-consultation-name"
                  name="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.currentTarget.value })}
                />
              </div>
              <div className="tw-basis-1/2 tw-p-4">
                <label htmlFor="type" className="form-text tailwindui">
                  Type
                </label>
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
              </div>
              {organisation.consultations
                .find((e) => e.name === data.type)
                ?.fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                .map((field) => {
                  return (
                    <CustomFieldInput
                      colWidth={6}
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
            </div>
            {data.user === user._id && (
              <>
                <hr />
                <div>
                  <div>
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
                </div>
              </>
            )}
            <hr />
            <div className="-tw-mx-4 tw-flex tw-flex-wrap">
              <div className="tw-basis-1/2 tw-p-4">
                <label htmlFor="new-consultation-select-status">Statut</label>
                <SelectStatus
                  name="status"
                  value={data.status || ''}
                  onChange={(e) => {
                    setData({ ...data, status: e.target.value });
                  }}
                  inputId="new-consultation-select-status"
                  classNamePrefix="new-consultation-select-status"
                />
              </div>
              <div className="tw-basis-1/2 tw-p-4">
                <label htmlFor="create-consultation-dueat">Date prévue</label>
                <div>
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
                </div>
              </div>

              {[DONE, CANCEL].includes(data.status) && (
                <>
                  <div className="tw-basis-1/2 tw-p-4" />
                  <div className="tw-basis-1/2 tw-p-4">
                    <label htmlFor="create-consultation-completedAt">Date réalisée</label>
                    <div>
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
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={['tw-flex tw-min-h-screen tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Documents' ? 'tw-hidden' : ''].join(' ')}>
            {data.person && (
              <Documents
                personId={data.person}
                documents={data.documents}
                onAdd={async (docResponse) => {
                  const { data: file, encryptedEntityKey } = docResponse;
                  setData({
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
                  });
                }}
                onDelete={async (document) => {
                  setData({ ...data, documents: data.documents.filter((d) => d._id !== document._id) });
                }}
              />
            )}
          </div>
          <div
            className={['tw-flex tw-min-h-screen tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Commentaires' ? 'tw-hidden' : ''].join(' ')}>
            <CommentsModule
              comments={data.comments}
              typeForNewComment="consultation"
              onDeleteComment={(comment) => {
                console.log('delete comment', comment);
                setData({ ...data, comments: data.comments.filter((c) => c._id !== comment._id) });
              }}
              onSubmitComment={(comment, isNewComment) => {
                if (isNewComment) {
                  setData({ ...data, comments: [{ ...comment, _id: uuidv4() }, ...data.comments] });
                } else {
                  setData({ ...data, comments: data.comments.map((c) => (c._id === comment._id ? comment : c)) });
                }
              }}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button name="Annuler" type="button" className="button-cancel" onClick={() => onClose()}>
          Annuler
        </button>
        {!isNewConsultation && (
          <button
            type="button"
            name="cancel"
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
        <button type="submit" className="button-submit" form="add-consultation-form">
          Sauvegarder
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}
