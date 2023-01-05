import React, { useEffect, useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import ButtonCustom from '../../components/ButtonCustom';
import UserName from '../../components/UserName';
import { userState } from '../../recoil/auth';
import { dayjsInstance } from '../../services/date';
import useApi from '../../services/api';
import { useDataLoader } from '../../components/DataLoader';
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from '../../components/tailwind/Modal';
import SelectCustom from '../../components/SelectCustom';
import { placesState, preparePlaceForEncryption } from '../../recoil/places';
import SelectUser from '../../components/SelectUser';
import { toast } from 'react-toastify';
import { prepareRelPersonPlaceForEncryption, relsPersonPlaceState } from '../../recoil/relPersonPlace';
import QuestionMarkButton from '../../components/QuestionMarkButton';

const PersonPlaces = ({ person }) => {
  const user = useRecoilValue(userState);
  const places = useRecoilValue(placesState);
  const setRelsPersonPlace = useSetRecoilState(relsPersonPlaceState);

  const [relPersonPlaceModal, setRelPersonPlaceModal] = useState(null);
  const [placeToEdit, setPlaceToEdit] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const { refresh } = useDataLoader();
  const API = useApi();

  const onDeleteRelPersonPlace = async (relPersonPlace) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce lieu fréquenté ?')) return;
    setDeleting(true);
    const response = await API.delete({ path: `/relPersonPlace/${relPersonPlace?._id}` });
    setDeleting(false);
    if (!response.ok) return toast.error(response.error);
    setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace?._id));
  };

  const sameMultiplePlaces = useMemo(() => {
    const places = person.relsPersonPlace?.map((relPersonPlace) => relPersonPlace.place);
    return places.length !== new Set(places).size;
  }, [person.relsPersonPlace]);

  return (
    <>
      <div className="tw-my-10 tw-flex tw-items-center tw-gap-2">
        <h3 className="tw-mb-0 tw-flex tw-items-center tw-gap-5 tw-text-xl tw-font-extrabold">
          Lieux fréquentés {person.relsPersonPlace?.length ? `(${person.relsPersonPlace?.length})` : ''}{' '}
          <QuestionMarkButton onClick={() => setHelpModal(true)} />
        </h3>
        <ButtonCustom
          title="Ajouter un lieu"
          className="tw-ml-auto"
          onClick={() => {
            refresh(); // just refresh to make sure we have the latest data
            setRelPersonPlaceModal({ place: null, user: user._id });
          }}
        />
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
            {person.relsPersonPlace?.map((relPersonPlace) => {
              const { place: placeId, createdAt, user } = relPersonPlace;
              const place = places.find((p) => p._id === placeId);
              return (
                <tr key={JSON.stringify(relPersonPlace)} className="tw-cursor-default">
                  <td className="tw-group" data-test-id={place?.name}>
                    {place.name}
                    <button
                      aria-label={`Modifier le nom du lieu ${place?.name}`}
                      title={`Modifier le nom du lieu ${place?.name}`}
                      className="noprint tw-invisible tw-z-50 tw-ml-4 tw-cursor-pointer tw-p-0 tw-text-sm tw-text-main hover:tw-underline group-hover:tw-visible"
                      onClick={() => setPlaceToEdit(place)}
                      type="button">
                      Modifier le nom du lieu
                    </button>
                  </td>
                  <td width="15%">
                    <UserName id={user} />
                  </td>
                  <td width="15%">{dayjsInstance(createdAt).format('DD/MM/YYYY HH:mm')}</td>
                  <td width="15%">
                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
                      <button
                        aria-label={`Modifier le lieu fréquenté ${place?.name}`}
                        title={`Modifier le lieu fréquenté ${place?.name}`}
                        type="button"
                        className="button-classic"
                        onClick={() => setRelPersonPlaceModal(relPersonPlace)}>
                        Modifier
                      </button>
                      <button
                        aria-label={`Supprimer le lieu fréquenté ${place?.name}`}
                        disabled={deleting}
                        type="button"
                        className="button-destructive"
                        onClick={() => onDeleteRelPersonPlace(relPersonPlace)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <EditRelPersonPlaceModal open={!!placeToEdit} setOpen={setPlaceToEdit} placeToEdit={placeToEdit} />
      <RelPersonPlaceModal
        open={!!relPersonPlaceModal}
        setOpen={setRelPersonPlaceModal}
        person={person}
        relPersonPlaceModal={relPersonPlaceModal}
        setPlaceToEdit={setPlaceToEdit}
      />
      <HelpModal open={!!helpModal} setOpen={setHelpModal} sameMultiplePlaces={sameMultiplePlaces} />
    </>
  );
};

const RelPersonPlaceModal = ({ open, setOpen, person, relPersonPlaceModal, setPlaceToEdit }) => {
  const [places, setPlaces] = useRecoilState(placesState);
  const setRelsPersonPlace = useSetRecoilState(relsPersonPlaceState);
  const me = useRecoilValue(userState);
  const [placeId, setPlaceId] = useState(relPersonPlaceModal?.place);
  const [userId, setUserId] = useState(relPersonPlaceModal?.user ?? me._id);
  const [posting, setUpdating] = useState(false);
  const API = useApi();
  const { refresh } = useDataLoader();

  useEffect(() => {
    setPlaceId(relPersonPlaceModal?.place);
    setUserId(relPersonPlaceModal?.user ?? me._id);
  }, [me._id, relPersonPlaceModal]);

  const onCreatePlace = async (name) => {
    if (!name?.length) return toast.error('Le nom du lieu est obligatoire');
    if (places.find((p) => p.name?.toLocaleLowerCase() === name?.toLocaleLowerCase())) {
      toast.error('Ce lieu existe déjà');
      return;
    }
    setUpdating(true);
    const response = await API.post({ path: '/place', body: preparePlaceForEncryption({ name }) });
    setUpdating(false);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    setPlaces((places) =>
      [response.decryptedData, ...places].sort((p1, p2) =>
        p1?.name?.toLocaleLowerCase().localeCompare(p2.name?.toLocaleLowerCase(), 'fr', { ignorPunctuation: true, sensitivity: 'base' })
      )
    );
    setPlaceId(response.decryptedData._id);
  };

  const onEditPlace = async (e) => {
    e.stopPropagation();
    setPlaceToEdit(places.find((p) => p._id === placeId));
  };

  const onSaveRelPersonPlace = async (e) => {
    e.preventDefault();
    if (person.relsPersonPlace?.find((rpp) => rpp.place === placeId)) {
      toast.error('Ce lieu est déjà enregistré pour cette personne');
      return;
    }
    setUpdating(true);
    const isNew = !relPersonPlaceModal?._id;
    const response = isNew
      ? await API.post({
          path: '/relPersonPlace',
          body: prepareRelPersonPlaceForEncryption({ place: placeId, person: person._id, user: userId }),
        })
      : await API.put({
          path: `/relPersonPlace/${relPersonPlaceModal._id}`,
          body: prepareRelPersonPlaceForEncryption({ place: placeId, person: person._id, user: userId }),
        });

    setUpdating(false);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success(`Le lieu a été ${isNew ? 'ajouté' : 'modifié'}`);
    if (isNew) {
      setRelsPersonPlace((relsPersonPlace) => [response.decryptedData, ...relsPersonPlace]);
    } else {
      setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.map((r) => (r._id === relPersonPlaceModal._id ? response.decryptedData : r)));
    }
    refresh();
    setOpen(null);
  };

  return (
    <ModalContainer open={open}>
      <ModalHeader title="Ajouter un lieu fréquenté" />
      <ModalBody>
        <form id="new-rel-person-place" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8 tw-py-4" onSubmit={onSaveRelPersonPlace}>
          <div>
            <label htmlFor="place" className="form-text tailwindui">
              Lieu
            </label>
            <SelectCustom
              options={places}
              name="place"
              onChange={(place) => setPlaceId(place._id)}
              isClearable={false}
              isDisabled={posting}
              value={places.find((p) => p._id === placeId)}
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
                      onMouseUp={onEditPlace}
                      // onTouchEnd required to work on tablet
                      // see https://github.com/JedWatson/react-select/issues/3117#issuecomment-1286232693 for similar issue
                      onTouchEnd={onEditPlace}
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
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(null)}>
          Annuler
        </button>
        <button type="submit" className="button-submit" form="new-rel-person-place">
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

const EditRelPersonPlaceModal = ({ open, setOpen, placeToEdit }) => {
  const [places, setPlaces] = useRecoilState(placesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);

  const [updating, setUpdating] = useState(false);
  const API = useApi();
  const { refresh } = useDataLoader();
  const [name, setName] = useState(placeToEdit?.name);

  useEffect(() => {
    setName(placeToEdit?.name);
  }, [placeToEdit]);

  const onEditPlace = async (e) => {
    e.preventDefault();
    if (!name?.length) return toast.error('Le nom du lieu est obligatoire');
    if (places.filter((p) => p._id !== placeToEdit._id).find((p) => p.name?.toLocaleLowerCase() === name?.toLocaleLowerCase())) {
      toast.error('Ce lieu existe déjà');
      return;
    }
    setUpdating(true);
    const response = await API.put({
      path: `/place/${placeToEdit._id}`,
      body: preparePlaceForEncryption({ ...placeToEdit, name }),
    });
    setUpdating(false);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success(`Le nom du lieu a été modifié`);
    setPlaces((places) => places.map((p) => (p._id === placeToEdit._id ? response.decryptedData : p)));
    refresh();
    setOpen(null);
  };

  const onDelete = async () => {
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer le lieu "${placeToEdit.name}" ? Cette action est irréversible et entrainera la suppression de tous les lieux fréquentés associés.`
      )
    ) {
      return;
    }
    setUpdating(true);
    const response = await API.delete({ path: `/place/${placeToEdit._id}` });
    setUpdating(false);
    if (response.error) {
      toast.error(response.error);
      return;
    }
    setPlaces((places) => places.filter((p) => p._id !== placeToEdit._id));
    for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.place === placeToEdit._id)) {
      await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
    }
    setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel.place !== placeToEdit._id));
    toast.success('Lieu supprimé !');
    refresh();
    setOpen(null);
  };

  return (
    <ModalContainer open={open}>
      <ModalHeader title="Éditer le nom du lieu" />
      <ModalBody>
        <form id="edit-place-name" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8 tw-py-4" onSubmit={onEditPlace}>
          <div>
            <label htmlFor="place" className="form-text tailwindui">
              Nouveau nom
            </label>
            <input
              type="text"
              id="place"
              className="tailwindui"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeToEdit?.name}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(null)}>
          Annuler
        </button>
        <button type="button" className="button-destructive" onClick={onDelete}>
          Supprimer
        </button>
        <button type="submit" className="button-submit" form="edit-place-name" disabled={updating}>
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

const HelpModal = ({ open, setOpen, sameMultiplePlaces }) => {
  useEffect(() => {
    if (!window.localStorage.getItem('lieux-fréquentés-help-modal-seen')) {
      setOpen(true);
    }
    if (!open) {
      window.localStorage.setItem('lieux-fréquentés-help-modal-seen', true);
    }
  }, [open, setOpen]);
  return (
    <ModalContainer open={open} size="3xl">
      <ModalHeader title="Aide" />
      <ModalBody>
        <div className="tw-flex tw-flex-col tw-gap-4  tw-px-8 tw-py-4">
          <h4>Fonctionnement des Lieux Fréquentés</h4>
          <p>
            Un lieu peut être fréquenté par <b> plusieurs personnes différentes.</b>
            <br />
            <br />
            Ainsi, la liste de lieux disponibles n'est pas propre à une personne, mais est <b>commune à l'organisation</b>.
            <br />
            <br />
            La liste des "Lieux fréquentés" ci-dessous est la liste des lieux <b>uniques fréquentés par cette personne.</b>
          </p>
          {!!sameMultiplePlaces && (
            <small>
              Le fonctionnement des lieux a changé depuis début 2023. Nous n'avons pas voulu supprimer vos données déjà créées, c'est pourquoi cette
              personne a plusieurs fois le même lieu. Mais il est désormais impossible de rajouter plusieurs lieux identiques pour une même personne.
            </small>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            setOpen(null);
          }}>
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default PersonPlaces;
