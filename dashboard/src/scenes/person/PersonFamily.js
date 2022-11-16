import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import ButtonCustom from '../../components/ButtonCustom';
import UserName from '../../components/UserName';
import { userState } from '../../recoil/auth';
import { dayjsInstance } from '../../services/date';
import useApi from '../../services/api';
import { groupSelector, groupsState, prepareGroupForEncryption } from '../../recoil/group';
import SelectPerson from '../../components/SelectPerson';
import { useDataLoader } from '../../components/DataLoader';
import PersonName from '../../components/PersonName';
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from '../../components/tailwind/Modal';

const PersonFamily = ({ person }) => {
  const [groups, setGroups] = useRecoilState(groupsState);
  const user = useRecoilValue(userState);
  const personGroup = useRecoilValue(groupSelector({ personId: person?._id }));
  const [newRelationModalOpen, setNewRelationModalOpen] = useState(false);
  const [relationToEdit, setRelationToEdit] = useState(null);
  const { refresh } = useDataLoader();
  const API = useApi();

  const onAddFamilyLink = async (e) => {
    e.preventDefault();
    const { personId, relation } = Object.fromEntries(new FormData(e.target));
    if (person._id === personId) {
      return toast.error("Le lien avec cette personne est vite vu : c'est elle !");
    }
    if (personGroup.persons.find((_personId) => _personId === personId)) {
      return toast.error('Il y a déjà un lien entre ces deux personnes');
    }
    if (groups.find((group) => group.persons.find((_personId) => _personId === personId))) {
      return toast.error(
        "Cette personne fait déjà partie d'une autre famille",
        "Vous ne pouvez pour l'instant pas ajouter une personne à plusieurs familles. N'hésitez pas à nous contacter si vous souhaitez faire évoluer cette fonctionnalité."
      );
    }
    const nextGroup = {
      ...personGroup,
      persons: [...new Set([...personGroup.persons, person._id, personId])],
      relations: [
        ...personGroup.relations,
        {
          _id: uuidv4(),
          persons: [person._id, personId],
          relation,
          createdAt: dayjs(),
          updatedAt: dayjs(),
          user: user._id,
        },
      ],
    };
    const isNew = !personGroup?._id;
    const response = isNew
      ? await API.post({ path: '/group', body: prepareGroupForEncryption(nextGroup) })
      : await API.put({ path: `/group/${personGroup._id}`, body: prepareGroupForEncryption(nextGroup) });
    if (response.ok) {
      setGroups((groups) =>
        isNew ? [...groups, response.decryptedData] : groups.map((group) => (group._id === personGroup._id ? response.decryptedData : group))
      );
      setNewRelationModalOpen(false);
      toast.success('Le lien familial a été ajouté');
    }
  };

  const onEditFamilyLink = async (e) => {
    e.preventDefault();
    const { personId, relation } = Object.fromEntries(new FormData(e.target));
    if (person._id === personId) {
      return toast.error("Le lien avec cette personne est vite vu : c'est elle !");
    }
    if (personGroup.persons.find((_personId) => _personId === personId)) {
      return toast.error('Il y a déjà un lien entre ces deux personnes');
    }
    if (groups.find((group) => group.persons.find((_personId) => _personId === personId))) {
      return toast.error(
        "Cette personne fait déjà partie d'une autre famille",
        "Vous ne pouvez pour l'instant pas ajouter une personne à plusieurs familles. N'hésitez pas à nous contacter si vous souhaitez faire évoluer cette fonctionnalité."
      );
    }
    const nextGroup = {
      ...personGroup,
      persons: [...new Set([...personGroup.persons, person._id, personId])],
      relations: [...personGroup.relations, { persons: [person._id, personId], relation, createdAt: dayjs(), updatedAt: dayjs(), user: user._id }],
    };
    const isNew = !personGroup?._id;
    const response = isNew
      ? await API.post({ path: '/group', body: prepareGroupForEncryption(nextGroup) })
      : await API.put({ path: `/group/${personGroup._id}`, body: prepareGroupForEncryption(nextGroup) });
    if (response.ok) {
      setGroups((groups) =>
        isNew ? [...groups, response.decryptedData] : groups.map((group) => (group._id === personGroup._id ? response.decryptedData : group))
      );
      setNewRelationModalOpen(false);
      toast.success('Le lien familial a été ajouté');
    }
  };

  return (
    <>
      <div className="tw-my-10 tw-flex tw-items-center tw-gap-2">
        <h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Liens familiaux</h3>
        <ButtonCustom
          title="Ajouter un lien"
          className="tw-ml-auto"
          onClick={() => {
            refresh(); // just refresh to make sure we have the latest data
            setNewRelationModalOpen(true);
          }}
        />
        <NewRelation open={newRelationModalOpen} setOpen={setNewRelationModalOpen} onAddFamilyLink={onAddFamilyLink} person={person} />
      </div>
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Lien entre</th>
            <th>Relation</th>
            <th>Enregistré par</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="small">
          {personGroup.relations.map((rel) => {
            const { relation, persons, createdAt, user } = rel;
            return (
              <tr key={JSON.stringify(persons)}>
                <td>
                  <PersonName item={{ person: persons[0] }} redirectToTab="famille" />
                  {' et '}
                  <PersonName item={{ person: persons[1] }} redirectToTab="famille" />
                </td>
                <td>{relation}</td>
                <td width="15%">
                  <UserName id={user} />
                </td>
                <td width="15%">{dayjsInstance(createdAt).format('DD/MM/YYYY HH:mm')}</td>
                <td width="15%">
                  <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
                    <button type="button" className="button-classic" onClick={() => setRelationToEdit(rel)}>
                      Modifier
                    </button>
                    <button type="button" className="button-destructive">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <EditRelation
          open={!!relationToEdit}
          setOpen={setRelationToEdit}
          onEditFamilyLink={onEditFamilyLink}
          person={person}
          relationToEdit={relationToEdit}
        />
      </table>
    </>
  );
};

const NewRelation = ({ open, setOpen, onEditFamilyLink, person }) => {
  return (
    <ModalContainer open={open}>
      <ModalHeader title="Nouveau lien familial" />
      <ModalBody>
        <form id="new-family-relation" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditFamilyLink}>
          <div>
            <label htmlFor="personId" className="form-text tailwindui">
              Nouvelle relation entre {person.name} et...
            </label>
            <SelectPerson name="personId" noLabel disableAccessToPerson />
          </div>
          <div>
            <label htmlFor="relation" className="form-text tailwindui">
              Relation/commentaire
            </label>
            <input className="form-text tailwindui" id="relation" name="relation" type="text" placeholder="Père/fille, mère/fils..." />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="submit" className="button-submit" form="new-family-relation">
          Enregistrer
        </button>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

const EditRelation = ({ open, setOpen, onEditFamilyLink, relationToEdit }) => {
  return (
    <ModalContainer open={open}>
      <ModalHeader title="Éditer le lien familial" />
      <ModalBody>
        <form
          key={JSON.stringify(relationToEdit)}
          id="edit-family-relation"
          className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8"
          onSubmit={onEditFamilyLink}>
          <div>
            <label htmlFor="personId1" className="form-text tailwindui">
              Relation entre...
            </label>
            <SelectPerson name="personId1" noLabel disableAccessToPerson defaultValue={relationToEdit?.persons[0]} />
          </div>
          <div>
            <label htmlFor="personId2" className="form-text tailwindui">
              et...
            </label>
            <SelectPerson name="personId2" noLabel disableAccessToPerson defaultValue={relationToEdit?.persons[1]} />
          </div>
          <div>
            <label htmlFor="relation" className="form-text tailwindui">
              Relation/commentaire
            </label>
            <input
              className="form-text tailwindui"
              id="relation"
              name="relation"
              type="text"
              placeholder="Père/fille, mère/fils..."
              defaultValue={relationToEdit?.relation}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="submit" className="button-submit" form="new-family-relation">
          Enregistrer
        </button>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(null)}>
          Annuler
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default PersonFamily;
