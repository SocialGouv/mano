import { Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { allowedFieldsInHistorySelector, personFieldsSelector, personsState, usePreparePersonForEncryption } from '../../../recoil/persons';
import { currentTeamState, userState } from '../../../recoil/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import CustomFieldInput from '../../../components/CustomFieldInput';
import { useState } from 'react';
import ButtonCustom from '../../../components/ButtonCustom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import useApi from '../../../services/api';

export default function EditModal({ person, selectedPanel, onClose }) {
  const [openPanels, setOpenPanels] = useState([selectedPanel]);
  const user = useRecoilValue(userState);
  const allowedFieldsInHistory = useRecoilValue(allowedFieldsInHistorySelector);
  const team = useRecoilValue(currentTeamState);
  const setPersons = useSetRecoilState(personsState);
  const API = useApi();
  const preparePersonForEncryption = usePreparePersonForEncryption();
  const personFields = useRecoilValue(personFieldsSelector);

  return (
    <Modal isOpen={true} toggle={() => onClose()} size="lg" backdrop="static">
      <ModalHeader toggle={() => onClose()}>Modifier {person.name}</ModalHeader>
      <ModalBody>
        <Formik
          enableReinitialize
          initialValues={person}
          onSubmit={async (body) => {
            if (!body.name?.trim()?.length) return toast.error('Une personne doit avoir un nom');
            if (!body.followedSince) body.followedSince = person.createdAt;
            body.entityKey = person.entityKey;

            console.log('person', person);
            console.log('body', body);
            return;

            const historyEntry = {
              date: new Date(),
              user: user._id,
              data: {},
            };
            for (const key in body) {
              if (!allowedFieldsInHistory.includes(key)) continue;
              if (body[key] !== person[key]) historyEntry.data[key] = { oldValue: person[key], newValue: body[key] };
            }
            if (!!Object.keys(historyEntry.data).length) body.history = [...(person.history || []), historyEntry];

            const response = await API.put({
              path: `/person/${person._id}`,
              body: preparePersonForEncryption(body),
            });
            if (response.ok) {
              const newPerson = response.decryptedData;
              setPersons((persons) =>
                persons.map((p) => {
                  if (p._id === person._id) return newPerson;
                  return p;
                })
              );
              toast.success('Mis à jour !');
              onClose();
            } else {
              toast.error("Erreur de l'enregistrement, les données n'ont pas été enregistrées");
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue }) => {
            return (
              <>
                <div className="tw-text-sm">
                  <div>
                    <div
                      className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                      onClick={() => {
                        if (openPanels.includes('main')) {
                          setOpenPanels(openPanels.filter((p) => p !== 'main'));
                        } else {
                          setOpenPanels([...openPanels, 'main']);
                        }
                      }}>
                      <div className="tw-flex-1">Informations principales</div>
                      <div>{!openPanels.includes('main') ? '+' : '-'}</div>
                    </div>
                    {openPanels.includes('main') && (
                      <Row>
                        {personFields
                          .find((group) => group.name === 'Résumé')
                          .fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                          .filter((f) => !f.hiddenInEditPerson)
                          .map((field) => (
                            <CustomFieldInput
                              model="person"
                              values={values}
                              handleChange={handleChange}
                              field={field}
                              key={field.name}
                              colWidth={field.colWidth}
                            />
                          ))}
                      </Row>
                    )}
                  </div>
                  {!['restricted-access'].includes(user.role) && (
                    <div>
                      <div
                        className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                        onClick={() => {
                          if (openPanels.includes('social')) {
                            setOpenPanels(openPanels.filter((p) => p !== 'social'));
                          } else {
                            setOpenPanels([...openPanels, 'social']);
                          }
                        }}>
                        <div className="tw-flex-1">Informations sociales</div>
                        <div>{!openPanels.includes('social') ? '+' : '-'}</div>
                      </div>
                      {openPanels.includes('social') && (
                        <Row>
                          {personFields
                            .find((group) => group.name === 'Informations sociales')
                            .fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                            .map((field) => (
                              <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                            ))}
                        </Row>
                      )}
                    </div>
                  )}
                  {!['restricted-access'].includes(user.role) && (
                    <div>
                      <div
                        className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                        onClick={() => {
                          if (openPanels.includes('medical')) {
                            setOpenPanels(openPanels.filter((p) => p !== 'medical'));
                          } else {
                            setOpenPanels([...openPanels, 'medical']);
                          }
                        }}>
                        <div className="tw-flex-1">Informations médicales</div>
                        <div>{!openPanels.includes('medical') ? '+' : '-'}</div>
                      </div>
                      {openPanels.includes('medical') && (
                        <Row>
                          {personFields
                            .find((group) => group.name === 'Informations médicales')
                            .fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                            .map((field) => (
                              <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                            ))}
                        </Row>
                      )}
                    </div>
                  )}
                </div>
                <div className="tw-flex tw-items-end tw-justify-end tw-gap-2">
                  <ButtonCustom disabled={isSubmitting} color="secondary" onClick={onClose} title="Annuler" />
                  <ButtonCustom
                    disabled={isSubmitting || JSON.stringify(person) === JSON.stringify(values)}
                    color="primary"
                    type="submit"
                    onClick={handleSubmit}
                    title="Enregistrer"
                  />
                </div>
              </>
            );
          }}
        </Formik>
      </ModalBody>
    </Modal>
  );
}
