import React, { useState } from "react";
import { toast } from "react-toastify";
import { useRecoilState, useRecoilValue } from "recoil";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import ButtonCustom from "../../components/ButtonCustom";
import UserName from "../../components/UserName";
import { userState } from "../../recoil/auth";
import { dayjsInstance } from "../../services/date";
import API, { tryFetchExpectOk } from "../../services/api";
import { groupSelector, groupsState, encryptGroup } from "../../recoil/groups";
import SelectPerson from "../../components/SelectPerson";
import { useDataLoader } from "../../components/DataLoader";
import PersonName from "../../components/PersonName";
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from "../../components/tailwind/Modal";
import { itemsGroupedByPersonSelector } from "../../recoil/selectors";

const PersonFamily = ({ person }) => {
  const [groups] = useRecoilState(groupsState);
  const user = useRecoilValue(userState);
  const personGroup = useRecoilValue(groupSelector({ personId: person?._id }));
  const itemsGroupedByPerson = useRecoilValue(itemsGroupedByPersonSelector);
  const [newRelationModalOpen, setNewRelationModalOpen] = useState(false);
  const [relationToEdit, setRelationToEdit] = useState(null);
  const { refresh } = useDataLoader();

  const onAddFamilyLink = async (e) => {
    e.preventDefault();
    const { personId, description, ...otherNewRelations } = Object.fromEntries(new FormData(e.target));
    if (person._id === personId) {
      return toast.error("Le lien avec cette personne est vite vu : c'est elle !");
    }
    if (personGroup.persons.find((_personId) => _personId === personId)) {
      return toast.error("Il y a déjà un lien entre ces deux personnes");
    }
    const personDoesntBelongToAGroupYet = !personGroup?.persons?.length;
    const personAlreadyBelongToAGroup = !personDoesntBelongToAGroupYet;
    const otherPersonAlreadyBelongToAGroup = groups.find((group) => group.persons.find((_personId) => _personId === personId));
    if (personAlreadyBelongToAGroup && otherPersonAlreadyBelongToAGroup) {
      return toast.error(
        "Cette personne fait déjà partie d'une autre famille.\nVous ne pouvez pour l'instant pas ajouter une personne à plusieurs familles.\nN'hésitez pas à nous contacter si vous souhaitez faire évoluer cette fonctionnalité."
      );
    }
    const groupToEdit = otherPersonAlreadyBelongToAGroup || personGroup;
    const nextRelations = [
      {
        _id: uuidv4(),
        persons: [person._id, personId],
        description,
        createdAt: dayjs(),
        updatedAt: dayjs(),
        user: user._id,
      },
    ];
    for (const otherNewRelation of Object.keys(otherNewRelations) || []) {
      const otherPersonId = otherNewRelation.replace("description-", "");
      const description = otherNewRelations[otherNewRelation];
      if (person._id === otherPersonId) {
        continue;
      }
      nextRelations.push({
        _id: uuidv4(),
        persons: [person._id, otherPersonId],
        description,
        createdAt: dayjs(),
        updatedAt: dayjs(),
        user: user._id,
      });
    }

    const nextGroup = {
      ...groupToEdit,
      persons: [...new Set([...groupToEdit.persons, person._id, personId])],
      relations: [...groupToEdit.relations, ...nextRelations],
    };
    const isNew = !groupToEdit?._id;
    const [error] = await tryFetchExpectOk(async () =>
      isNew
        ? API.post({ path: "/group", body: await encryptGroup(nextGroup) })
        : API.put({ path: `/group/${groupToEdit._id}`, body: await encryptGroup(nextGroup) })
    );
    if (!error) {
      await refresh();
      setNewRelationModalOpen(false);
      toast.success("Le lien familial a été ajouté");
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
    const [error] = await tryFetchExpectOk(async () => API.put({ path: `/group/${personGroup._id}`, body: await encryptGroup(nextGroup) }));
    if (!error) {
      await refresh();
      setRelationToEdit(null);
      toast.success("Le lien familial a été modifié");
    }
  };

  const onDeleteRelation = async (relation) => {
    const personId1 = relation?.persons[0];
    const personId1Name = itemsGroupedByPerson[personId1]?.name;
    const personId2 = relation?.persons[1];
    const personId2Name = itemsGroupedByPerson[personId2]?.name;
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer le lien familial entre ${personId1Name} et ${personId2Name} ? Cette opération est irréversible.`
      )
    ) {
      return;
    }
    const nextRelations = personGroup.relations.filter((_relation) => _relation._id !== relation._id);
    if (!nextRelations.length) {
      const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/group/${personGroup._id}` }));
      if (!error) {
        await refresh();
        setRelationToEdit(null);
        toast.success("Le lien familial a été supprimé");
        return;
      }
    }
    const nextGroup = {
      persons: [...new Set(nextRelations.reduce((_personIds, relation) => [..._personIds, ...relation.persons], []))],
      relations: nextRelations,
    };
    const [error] = await tryFetchExpectOk(async () => API.put({ path: `/group/${personGroup._id}`, body: await encryptGroup(nextGroup) }));
    if (!error) {
      await refresh();
      setRelationToEdit(null);
      toast.success("Le lien familial a été supprimé");
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
      {!personGroup.persons.length ? (
        <div className="tw-py-10 tw-text-center tw-text-gray-300">
          <p className="tw-text-lg tw-font-bold">Cette personne n'a pas encore de lien familial</p>
          <p className="tw-mt-2 tw-text-sm">
            Pour ajouter un lien familial, cliquez sur le bouton <span className="tw-font-bold">Ajouter un lien</span> ci-dessus.
          </p>
        </div>
      ) : (
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
                    <PersonName item={{ person: persons[0] }} />
                    {" et "}
                    <PersonName item={{ person: persons[1] }} />
                  </td>
                  <td>{description}</td>
                  <td width="15%">
                    <UserName id={user} />
                  </td>
                  <td width="15%">{dayjsInstance(createdAt).format("DD/MM/YYYY HH:mm")}</td>
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
      )}
    </>
  );
};

const NewRelation = ({ open, setOpen, onAddFamilyLink, person }) => {
  const [rootPersonId, setRootPersonId] = useState(null);
  const persons = useRecoilValue(itemsGroupedByPersonSelector);
  const group = persons[rootPersonId]?.group;

  return (
    <ModalContainer open={open} size="3xl">
      <ModalHeader
        title={
          group?.persons?.length > 0 ? `Nouveaux liens familiaux entre ${person.name} et...` : `Nouveau lien familial entre ${person.name} et...`
        }
        setOpen={setOpen}
      />
      <ModalBody>
        <form id="new-family-relation" className="tw-flex tw-min-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onAddFamilyLink}>
          <div className="tw-flex tw-w-full tw-flex-wrap">
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label htmlFor="personId" className="form-text tailwindui">
                Personne suivie
              </label>
              <SelectPerson
                name="personId"
                noLabel
                disableAccessToPerson
                inputId="person-family-relation"
                value={rootPersonId}
                onChange={(e) => setRootPersonId(e.currentTarget.value)}
              />
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label htmlFor="description" className="form-text tailwindui">
                Relation/commentaire
              </label>
              <input
                className="form-text tailwindui"
                id="description"
                name="description"
                type="text"
                placeholder="Père/fille, mère/fils..."
                required
              />
            </div>
          </div>
          {group?.persons
            ?.filter((personId) => personId !== rootPersonId)
            .filter((personId) => !!persons[personId])
            .map((personId) => {
              return (
                <div key={personId} className="tw-flex tw-w-full tw-flex-wrap">
                  <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                    <label htmlFor="personId" className="form-text tailwindui">
                      Personne suivie
                    </label>
                    <div className="tailwindui">
                      <PersonName item={{ person: personId }} />
                    </div>
                  </div>
                  <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                    <label htmlFor="description" className="form-text tailwindui">
                      Relation/commentaire
                    </label>
                    <input
                      className="form-text tailwindui"
                      id="description"
                      name={`description-${personId}`}
                      required
                      type="text"
                      placeholder="Père/fille, mère/fils..."
                    />
                  </div>
                </div>
              );
            })}
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
          Annuler
        </button>
        <button type="submit" className="button-submit" form="new-family-relation">
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

const EditRelation = ({ open, setOpen, onEditRelation, onDeleteRelation, relationToEdit }) => {
  const itemsGroupedByPerson = useRecoilValue(itemsGroupedByPersonSelector);

  const personId1 = relationToEdit?.persons[0];
  const personId2 = relationToEdit?.persons[1];
  const personId1Name = itemsGroupedByPerson[personId1]?.name;
  const personId2Name = itemsGroupedByPerson[personId2]?.name;
  return (
    <ModalContainer open={open}>
      <ModalHeader title={`Éditer le lien familial entre ${personId1Name} et ${personId2Name}`} />
      <ModalBody>
        <form
          key={JSON.stringify(relationToEdit)}
          id="edit-family-relation"
          className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8 tw-py-4"
          onSubmit={onEditRelation}
        >
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
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(null)}>
          Annuler
        </button>
        <button type="button" className="button-destructive" onClick={() => onDeleteRelation(relationToEdit)}>
          Supprimer
        </button>
        <button type="submit" className="button-submit" form="edit-family-relation">
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default PersonFamily;
