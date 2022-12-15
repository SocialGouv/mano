import { useState, useMemo } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Row } from 'reactstrap';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { CANCEL, DONE, TODO } from '../recoil/actions';
import { currentTeamState, organisationState, userState } from '../recoil/auth';
import { consultationsState, defaultConsultationFields, prepareConsultationForEncryption } from '../recoil/consultations';
import useApi from '../services/api';
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

export default function ConsultationModal({ onClose, person, consultation }) {
  const organisation = useRecoilValue(organisationState);
  const team = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();
  const API = useApi();
  const isNewConsultation = !consultation;
  const initialState = useMemo(
    () =>
      consultation || {
        _id: uuidv4(),
        dueAt: new Date(),
        completedAt: new Date(),
        name: '',
        type: '',
        status: TODO,
        user: user._id,
        person: person?._id || null,
        organisation: organisation._id,
        onlyVisibleBy: [],
        createdAt: new Date(),
      },
    [organisation._id, person?._id, user._id, consultation]
  );
  const [data, setData] = useState(initialState);

  async function handleSubmit() {
    if (!data.type) {
      return toast.error('Veuillez choisir un type de consultation');
    }
    if ([DONE, CANCEL].includes(data.status)) {
      data.completedAt = data.completedAt || new Date();
    } else {
      data.completedAt = null;
    }
    const consultationResponse = isNewConsultation
      ? await API.post({
          path: '/consultation',
          body: prepareConsultationForEncryption(organisation.consultations)(data),
        })
      : await API.put({
          path: `/consultation/${initialState._id}`,
          body: prepareConsultationForEncryption(organisation.consultations)(data),
        });
    if (!consultationResponse.ok) return onClose();
    const consult = { ...consultationResponse.decryptedData, ...defaultConsultationFields };
    if (isNewConsultation) {
      setAllConsultations((all) => [...all, consult].sort((a, b) => new Date(b.dueAt) - new Date(a.dueAt)));
    } else {
      setAllConsultations((all) =>
        all
          .map((c) => {
            if (c._id === data._id) return consult;
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
          className="tw-mt-4 tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}>
          <div>
            {!person && (
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
          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            <div className="tw-flex tw-flex-col">
              <label htmlFor="create-consultation-name">Nom (facultatif)</label>
              <input
                className="form-text tailwindui"
                id="create-consultation-name"
                name="name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.currentTarget.value })}
              />
            </div>
            <div>
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
                placeholder="-- Choisissez le type de consultation --"
                options={organisation.consultations.map((e) => e.name)}
              />
            </div>
          </div>
          {/* We still need bootstrap here because `CustomFieldInput` */}
          <Row>
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
                      setData({ ...data, [e.currentTarget.name]: e.currentTarget.value });
                    }}
                    field={field}
                    key={field.name}
                  />
                );
              })}
          </Row>
          <hr />
          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            <div>
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
            <div>
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
            {[DONE, CANCEL].includes(data.status) && (
              <div>
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
            )}
          </div>
          <hr />
          {data.person && (
            <Documents
              title="Documents"
              person={data.person}
              documents={data.documents || []}
              onAdd={async (docResponse) => {
                const { data: file, encryptedEntityKey } = docResponse;
                setData({
                  ...data,
                  documents: [
                    ...(data.documents || []),
                    {
                      _id: file.filename,
                      name: file.originalname,
                      encryptedEntityKey,
                      createdAt: new Date(),
                      createdBy: user._id,
                      downloadPath: `/person/${data.person._id}/document/${file.filename}`,
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
        </form>
      </ModalBody>
      <ModalFooter>
        <button name="Annuler" type="button" className="button-cancel" onClick={() => onClose()}>
          Annuler
        </button>
        <button type="submit" className="button-submit" form="add-consultation-form">
          Sauvegarder
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}
