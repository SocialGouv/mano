import { atom, useRecoilState } from 'recoil';
import useApi from '../services/api';
import { capture } from '../services/sentry';

export const relsPersonPlaceState = atom({
  key: 'relsPersonPlaceState',
  default: [],
});

export const useRelsPerson = () => {
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);

  const API = useApi();

  const deleteRelation = async (id) => {
    const res = await API.delete({ path: `/relPersonPlace/${id}` });
    if (res.ok) {
      setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== id));
    }
    return res;
  };

  const addRelation = async (place) => {
    try {
      const res = await API.post({ path: '/relPersonPlace', body: prepareRelPersonPlaceForEncryption(place) });
      if (res.ok) {
        setRelsPersonPlace((relsPersonPlace) => [res.decryptedData, ...relsPersonPlace]);
      }
      return res;
    } catch (error) {
      capture('error in creating relPersonPlace' + error, { extra: { error, place } });
      return { ok: false, error: error.message };
    }
  };

  return {
    relsPersonPlace,
    setRelsPersonPlace,
    deleteRelation,
    addRelation,
  };
};

const encryptedFields = ['place', 'person', 'user'];

export const prepareRelPersonPlaceForEncryption = (relPersonPlace) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = relPersonPlace[field];
  }
  return {
    _id: relPersonPlace._id,
    createdAt: relPersonPlace.createdAt,
    updatedAt: relPersonPlace.updatedAt,
    organisation: relPersonPlace.organisation,

    decrypted,
    entityKey: relPersonPlace.entityKey,
  };
};
