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
import { personsState } from '../../recoil/persons';

const PersonFamily = ({ person }) => {
  const [groups, setGroups] = useRecoilState(groupsState);
  const user = useRecoilValue(userState);
  const personGroup = useRecoilValue(groupSelector({ personId: person?._id }));
  const persons = useRecoilValue(personsState);
  const [newRelationModalOpen, setNewRelationModalOpen] = useState(false);
  const [relationToEdit, setRelationToEdit] = useState(null);
  const { refresh } = useDataLoader();
  const API = useApi();

  const onAddFamilyLink = async (e) => {
    e.preventDefault();
    const { personId, description } = Object.fromEntries(new FormData(e.target));
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
          description,
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

  const onEditRelation = async (e) => {
    e.preventDefault();
    const { _id, description } = Object.fromEntries(new FormData(e.target));
    const nextGroup = {
      ...personGroup,
      relations: personGroup.relations.map((relation) =>
        relation._id === _id ? { ...relation, description, updatedAt: dayjs(), user: user._id } : relation
      ),
    };
    const response = await API.put({ path: `/group/${personGroup._id}`, body: prepareGroupForEncryption(nextGroup) });
    if (response.ok) {
      setGroups((groups) => groups.map((group) => (group._id === personGroup._id ? response.decryptedData : group)));
      setRelationToEdit(null);
      toast.success('Le lien familial a été modifié');
    }
  };

  const onDeleteRelation = async (relation) => {
    const personId1 = relation?.persons[0];
    const personId1Name = persons.find((p) => p._id === personId1)?.name;
    const personId2 = relation?.persons[1];
    const personId2Name = persons.find((p) => p._id === personId2)?.name;
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer le lien familial entre ${personId1Name} et ${personId2Name} ? Cette opération erst irréversible.`
      )
    ) {
      return;
    }
    const nextRelations = personGroup.relations.filter((_relation) => _relation._id !== relation._id);
    const nextGroup = {
      persons: [...new Set(nextRelations.reduce((_personIds, relation) => [..._personIds, ...relation.persons], []))],
      relations: nextRelations,
    };
    const response = await API.put({ path: `/group/${personGroup._id}`, body: prepareGroupForEncryption(nextGroup) });
    if (response.ok) {
      setGroups((groups) => groups.map((group) => (group._id === personGroup._id ? response.decryptedData : group)));
      setRelationToEdit(null);
      toast.success('Le lien familial a été supprimé');
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
          {personGroup.relations.map((_relation) => {
            const { description, persons, createdAt, user } = _relation;
            return (
              <tr key={JSON.stringify(persons)}>
                <td>
                  <PersonName item={{ person: persons[0] }} redirectToTab="famille" />
                  {' et '}
                  <PersonName item={{ person: persons[1] }} redirectToTab="famille" />
                </td>
                <td>{description}</td>
                <td width="15%">
                  <UserName id={user} />
                </td>
                <td width="15%">{dayjsInstance(createdAt).format('DD/MM/YYYY HH:mm')}</td>
                <td width="15%">
                  <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
                    <button type="button" className="button-classic" onClick={() => setRelationToEdit(_relation)}>
                      Modifier
                    </button>
                    <button type="button" className="button-destructive" onClick={() => onDeleteRelation(_relation)}>
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
          onEditRelation={onEditRelation}
          onDeleteRelation={onDeleteRelation}
          person={person}
          relationToEdit={relationToEdit}
        />
      </table>
    </>
  );
};

const NewRelation = ({ open, setOpen, onAddFamilyLink, person }) => {
  return (
    <ModalContainer open={open}>
      <ModalHeader title="Nouveau lien familial" />
      <ModalBody>
        <form id="new-family-relation" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onAddFamilyLink}>
          <div>
            <label htmlFor="personId" className="form-text tailwindui">
              Nouvelle relation entre {person.name} et...
            </label>
            <SelectPerson name="personId" noLabel disableAccessToPerson />
          </div>
          <div>
            <label htmlFor="description" className="form-text tailwindui">
              Relation/commentaire
            </label>
            <input className="form-text tailwindui" id="description" name="description" type="text" placeholder="Père/fille, mère/fils..." />
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

const EditRelation = ({ open, setOpen, onEditRelation, onDeleteRelation, relationToEdit }) => {
  const persons = useRecoilValue(personsState);
  const personId1 = relationToEdit?.persons[0];
  const personId2 = relationToEdit?.persons[1];

  return (
    <ModalContainer open={open}>
      <ModalHeader
        title={`Éditer le lien familial entre ${persons.find((p) => p._id === personId1)?.name} et ${persons.find((p) => p._id === personId2)?.name}`}
      />
      <ModalBody>
        <form
          key={JSON.stringify(relationToEdit)}
          id="edit-family-relation"
          className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8"
          onSubmit={onEditRelation}>
          <input type="hidden" name="_id" defaultValue={relationToEdit?._id} />
          <input type="hidden" name="personId1" defaultValue={relationToEdit?.persons[0]} />
          <input type="hidden" name="personId2" defaultValue={relationToEdit?.persons[1]} />
          <div>
            <label htmlFor="description" className="form-text tailwindui">
              Relation/commentaire
            </label>
            <input
              className="form-text tailwindui"
              id="description"
              name="description"
              type="text"
              placeholder="Père/fille, mère/fils..."
              defaultValue={relationToEdit?.description}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="submit" className="button-submit" form="edit-family-relation">
          Enregistrer
        </button>
        <button type="button" className="button-destructive" onClick={() => onDeleteRelation(relationToEdit)}>
          Supprimer
        </button>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(null)}>
          Annuler
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default PersonFamily;
