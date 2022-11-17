import { useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';
import Places from '../../components/Places';
import { itemsGroupedByPersonSelector, personsObjectSelector } from '../../recoil/selectors';
import useApi from '../../services/api';
import { formatDateWithFullMonth } from '../../services/date';
import History from './components/History';
import { MedicalFile } from './MedicalFile';
import Summary from './components/Summary';
import BackButton from '../../components/backButton';
import UserName from '../../components/UserName';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import { toast } from 'react-toastify';

// we take this selector to go faster when a change happens
const personSelector = selectorFamily({
  key: 'personSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const persons = get(personsObjectSelector);
      return persons[personId] || {};
    },
});

const populatedPersonSelector = selectorFamily({
  key: 'populatedPersonSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const persons = get(itemsGroupedByPersonSelector);
      return persons[personId] || {};
    },
});

export default function NewView() {
  const { personId } = useParams();
  const location = useLocation();
  const history = useHistory();
  const API = useApi();
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const person = useRecoilValue(populatedPersonSelector({ personId }));
  const setPersons = useSetRecoilState(personsState);
  const [currentTab, setCurrentTab] = useState('Résumé');

  return (
    <StyledContainer>
      <div style={{ display: 'flex', width: '100%' }}>
        <div>
          <BackButton />
        </div>
        <div style={{ flexGrow: 1, display: 'flex' }}>
          <ul className="nav nav-tabs" style={{ margin: 'auto' }}>
            <li role="presentation" className="nav-item">
              <button onClick={() => setCurrentTab('Résumé')} className={currentTab === 'Résumé' ? 'active nav-link' : 'btn-link nav-link'}>
                Résumé
              </button>
            </li>
            <li role="presentation" className="nav-item">
              <button
                onClick={() => setCurrentTab('Dossier Médical')}
                className={currentTab === 'Dossier Médical' ? 'active nav-link' : 'btn-link nav-link'}>
                Dossier Médical
              </button>
            </li>
            <li role="presentation" className="nav-item">
              <button
                onClick={() => setCurrentTab('Lieux fréquentés')}
                className={currentTab === 'Lieux fréquentés' ? 'active nav-link' : 'btn-link nav-link'}>
                Lieux fréquentés
              </button>
            </li>
            <li role="presentation" className="nav-item">
              <button onClick={() => setCurrentTab('Historique')} className={currentTab === 'Historique' ? 'active nav-link' : 'btn-link nav-link'}>
                Historique
              </button>
            </li>
          </ul>
        </div>
        <div>
          <UserName
            id={person.user}
            wrapper={() => 'Créée par '}
            canAddUser
            handleChange={async (newUser) => {
              const response = await API.put({
                path: `/person/${person._id}`,
                body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)({ ...person, user: newUser }),
              });
              if (response.ok) {
                toast.success('Personne mise à jour (créée par)');
                const newPerson = response.decryptedData;
                setPersons((persons) =>
                  persons.map((p) => {
                    if (p._id === person._id) return newPerson;
                    return p;
                  })
                );
              } else {
                toast.error('Impossible de mettre à jour la personne');
              }
            }}
          />
        </div>
      </div>
      <div className="pt-4">
        {person.outOfActiveList && (
          <Alert color="warning" className="noprint">
            {person?.name} est en dehors de la file active, pour le motif suivant : <b>{person.outOfActiveListReason}</b>{' '}
            {person.outOfActiveListDate && `le ${formatDateWithFullMonth(person.outOfActiveListDate)}`}
          </Alert>
        )}
        {currentTab === 'Résumé' && <Summary person={person} />}
        {currentTab === 'Dossier Médical' && <MedicalFile person={person} />}
        {currentTab === 'Lieux fréquentés' && <Places personId={person?._id} />}
        {currentTab === 'Historique' && <History person={person} />}
      </div>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  div.row {
    padding: 10px 0;
  }
`;
