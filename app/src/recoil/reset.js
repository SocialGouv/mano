import { useSetRecoilState } from 'recoil';
import { personsState } from './persons';
import { territoryObservationsState } from './territoryObservations';
import { territoriesState } from './territory';
import { passagesState } from './passages';
import { rencontresState } from './rencontres';
import { commentsState } from './comments';
import { placesState } from './places';
import { actionsState } from './actions';
import { reportsState } from './reports';
import { groupsState } from './groups';
import { relsPersonPlaceState } from './relPersonPlace';

const useResetAllCachedDataRecoilStates = () => {
  const setPersons = useSetRecoilState(personsState);
  const setActions = useSetRecoilState(actionsState);
  const setPlaces = useSetRecoilState(placesState);
  const setComments = useSetRecoilState(commentsState);
  const setPassages = useSetRecoilState(passagesState);
  const setRencontres = useSetRecoilState(rencontresState);
  const setTerritories = useSetRecoilState(territoriesState);
  const setObservations = useSetRecoilState(territoryObservationsState);
  const setReports = useSetRecoilState(reportsState);
  const setGroups = useSetRecoilState(groupsState);
  const setRelPersonPlaces = useSetRecoilState(relsPersonPlaceState);

  const setAll = () => {
    setPersons([]);
    setActions([]);
    setPlaces([]);
    setComments([]);
    setPassages([]);
    setRencontres([]);
    setTerritories([]);
    setObservations([]);
    setReports([]);
    setGroups([]);
    setRelPersonPlaces([]);
  };
  return setAll;
};

export default useResetAllCachedDataRecoilStates;
