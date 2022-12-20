import React, { useState } from 'react';
import { selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import ButtonCustom from '../../components/ButtonCustom';
import UserName from '../../components/UserName';
import { userState } from '../../recoil/auth';
import { dayjsInstance } from '../../services/date';
import useApi from '../../services/api';
import SelectPerson from '../../components/SelectPerson';
import { useDataLoader } from '../../components/DataLoader';
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from '../../components/tailwind/Modal';
import { personsState } from '../../recoil/persons';
import SelectCustom from '../../components/SelectCustom';
import { placesState, preparePlaceForEncryption } from '../../recoil/places';
import SelectUser from '../../components/SelectUser';
import { toast } from 'react-toastify';
import { prepareRelPersonPlaceForEncryption, relsPersonPlaceState } from '../../recoil/relPersonPlace';

const PersonPlaces = ({ person }) => {
  const user = useRecoilValue(userState);
  const [newRelationModalOpen, setNewRelationModalOpen] = useState(false);
  const [placeToEdit, setPlaceToEdit] = useState(null);
  const { refresh } = useDataLoader();
  const API = useApi();

  const onEditRelation = async (e) => {
    // e.preventDefault();
  };

  const onDeleteRelation = async (relation) => {};

  return (
    <>
      <div className="tw-my-10 tw-flex tw-items-center tw-gap-2">
        <h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">
          Lieux fréquentés {person.relsPersonPlace?.length ? `(${person.relsPersonPlace?.length})` : ''}
        </h3>
        <ButtonCustom
          title="Ajouter un lieu"
          className="tw-ml-auto"
          onClick={() => {
            refresh(); // just refresh to make sure we have the latest data
            setNewRelationModalOpen(true);
          }}
        />
        <NewRelPersonPlace open={newRelationModalOpen} setOpen={setNewRelationModalOpen} person={person} />
      </div>
      {!person.relsPersonPlace?.length ? (
        <div className="tw-py-10 tw-text-center tw-text-gray-300">
          <p className="tw-text-lg tw-font-bold">Cette personne n'a pas encore de lieu fréquenté</p>
          <p className="tw-mt-2 tw-text-sm">
            Pour ajouter un lieu fréquenté par {person.name}, cliquez sur le bouton <span className="tw-font-bold">Ajouter un lieu</span> ci-dessus.
          </p>
        </div>
      ) : (
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Lieu fréquenté</th>
              <th>Enregistré par</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="small">
            {person.relsPersonPlace?.map((_relation) => {
              const { place: placeId, createdAt, user } = _relation;
              const place = person.places.find((p) => p._id === placeId);
              return (
                <tr key={JSON.stringify(_relation)}>
                  <td>{place.name}</td>
                  <td width="15%">
                    <UserName id={user} />
                  </td>
                  <td width="15%">{dayjsInstance(createdAt).format('DD/MM/YYYY HH:mm')}</td>
                  <td width="15%">
                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
                      <button type="button" className="button-classic" onClick={() => setPlaceToEdit(_relation)}>
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
            open={!!placeToEdit}
            setOpen={setPlaceToEdit}
            onEditRelation={onEditRelation}
            onDeleteRelation={onDeleteRelation}
            person={person}
            placeToEdit={placeToEdit}
          />
        </table>
      )}
    </>
  );
};

const NewRelPersonPlace = ({ open, setOpen, person, onEditPlace }) => {
  const [places, setPlaces] = useRecoilState(placesState);
  const setRelsPersonPlace = useSetRecoilState(relsPersonPlaceState);
  const me = useRecoilValue(userState);
  const [place, setPlace] = useState(null);
  const [userId, setUserId] = useState(me._id);
  const [posting, setPosting] = useState(false);
  const API = useApi();
  const { refresh } = useDataLoader();

  const onCreatePlace = async (name) => {
    if (!name) return;
    if (places.find((p) => p.name?.toLocaleLowerCase() === name?.toLocaleLowerCase())) {
      toast.error('Ce lieu existe déjà');
      return;
    }
    setPosting(true);
    const response = await API.post({ path: '/place', body: preparePlaceForEncryption({ name }) });
    setPosting(false);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    setPlaces((places) =>
      [response.decryptedData, ...places].sort((p1, p2) =>
        p1?.name?.toLocaleLowerCase().localeCompare(p2.name?.toLocaleLowerCase(), 'fr', { ignorPunctuation: true, sensitivity: 'base' })
      )
    );
  };

  const onEditPlaceRequest = async (e) => {
    e.stopPropagation();
    console.log('edit bebe');
  };

  const onAddRelPersonPlace = async (e) => {
    e.preventDefault();
    setPosting(true);
    const response = await API.post({
      path: '/relPersonPlace',
      body: prepareRelPersonPlaceForEncryption({ place: place._id, person: person._id, user: userId }),
    });
    setPosting(false);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    setRelsPersonPlace((relsPersonPlace) => [response.decryptedData, ...relsPersonPlace]);
    refresh();
    setOpen(false);
  };

  return (
    <ModalContainer open={open}>
      <ModalHeader title="Ajouter un lieu fréquenté" />
      <ModalBody>
        <form id="new-rel-person-place" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8 tw-py-4" onSubmit={onAddRelPersonPlace}>
          <div>
            <label htmlFor="place" className="form-text tailwindui">
              Lieu
            </label>
            <SelectCustom
              options={places}
              name="place"
              onChange={setPlace}
              isClearable={false}
              isDisabled={posting}
              value={place}
              creatable
              onCreateOption={onCreatePlace}
              getOptionValue={(i) => i._id}
              getOptionLabel={(i) => i.name}
              formatOptionLabel={(place, options) => {
                if (options.context === 'menu') {
                  if (place.__isNew__) return <span>Créer "{place.value}"</span>;
                  return place?.name;
                }
                if (place.__isNew__) return <span>Création de {place.value}...</span>;
                return (
                  <div className="tw-flex tw-items-center">
                    <span>{place.name}</span>
                    <button
                      aria-label={`Modifier le nom du lieu ${place?.name}`}
                      title={`Modifier le nom du lieu ${place?.name}`}
                      className="noprint tw-z-50 tw-ml-4 tw-cursor-pointer tw-p-0 tw-text-sm tw-text-main hover:tw-underline"
                      onMouseUp={onEditPlaceRequest}
                      // onTouchEnd required to work on tablet
                      // see https://github.com/JedWatson/react-select/issues/3117#issuecomment-1286232693 for similar issue
                      onTouchEnd={onEditPlaceRequest}
                      type="button">
                      Modifier le nom du lieu
                    </button>
                  </div>
                );
              }}
              inputId="place"
              classNamePrefix="place"
            />
          </div>
          <div>
            <label htmlFor="user" className="form-text tailwindui">
              Enregistré par
            </label>
            <SelectUser inputId="user" value={userId} onChange={setUserId} />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
          Annuler
        </button>
        <button type="submit" className="button-submit" form="new-rel-person-place">
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

const EditRelation = ({ open, setOpen, onEditRelation, onDeleteRelation, placeToEdit }) => {
  const persons = useRecoilValue(personsState);
  const personId1 = placeToEdit?.persons[0];
  const personId2 = placeToEdit?.persons[1];

  return (
    <ModalContainer open={open}>
      <ModalHeader
        title={`Éditer le lien familial entre ${persons.find((p) => p._id === personId1)?.name} et ${persons.find((p) => p._id === personId2)?.name}`}
      />
      <ModalBody>
        <form
          key={JSON.stringify(placeToEdit)}
          id="edit-family-relation"
          className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8"
          onSubmit={onEditRelation}>
          <input type="hidden" name="_id" defaultValue={placeToEdit?._id} />
          <input type="hidden" name="personId1" defaultValue={placeToEdit?.persons[0]} />
          <input type="hidden" name="personId2" defaultValue={placeToEdit?.persons[1]} />
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
              defaultValue={placeToEdit?.description}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(null)}>
          Annuler
        </button>
        <button type="button" className="button-destructive" onClick={() => onDeleteRelation(placeToEdit)}>
          Supprimer
        </button>
        <button type="submit" className="button-submit" form="edit-family-relation">
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default PersonPlaces;
