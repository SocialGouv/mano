import { theme } from '../../../config';
import { dayjsInstance } from '../../../services/date';
import styled from 'styled-components';
import React, { useState } from 'react';
import EditModal from './EditModal';
import TagTeam from '../../../components/TagTeam';
import ExclamationMarkButton from '../../../components/ExclamationMarkButton';

export function InfosMain({ person }) {
  const [editModal, setEditModal] = useState(false);
  return (
    <Container>
      {Boolean(editModal) && <EditModal person={person} selectedPanel={'main'} onClose={() => setEditModal(false)} />}
      <div className="card !tw-bg-main">
        <div className="card-body">
          <div className="person-name">
            {person.alertness && <ExclamationMarkButton className="tw-mr-2" />}
            <b>{person.name}</b>
            {person.otherNames && <span> ({person.otherNames})</span>}
            <Teams person={person} />
          </div>
          <div className="person-description">
            <div>
              <div>
                <b>Age :</b> {dayjsInstance(person.birthdate).fromNow(true)}
              </div>
              <i>{dayjsInstance(person.birthdate).format('DD/MM/YYYY')}</i>
            </div>
            <div>
              <b>Genre : </b>
              {person.gender}
            </div>
            <div>
              <b>Suivi·e depuis le : </b>
              {dayjsInstance(person.followedSince || person.createdAt).format('DD/MM/YYYY')}
            </div>
            {person.wanderingAt ? (
              <div>
                <b>En rue depuis le : </b>
                {dayjsInstance(person.wanderingAt).format('DD/MM/YYYY')}
              </div>
            ) : null}
            <div>
              <b>Téléphone : </b>
              {person.phone}
            </div>
          </div>
          <button className="rounded px-2 py-1 tw-mt-4 tw-bg-white tw-text-sm tw-text-main" onClick={() => setEditModal(true)}>
            Modifier
          </button>
        </div>
      </div>
    </Container>
  );
}

const Teams = ({ person: { _id, assignedTeams } }) => (
  <div key={_id} className="tw-mt-2 tw-grid tw-gap-1">
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} className="tw-text-xs" />
    ))}
  </div>
);

const Container = styled.div`
  .card {
    min-height: 350px;
    display: flex;
    align-items: center;
    flex-direction: row;
  }
  .card-body {
    color: ${theme.white};
    text-align: center;
  }
  .person-name {
    border-bottom: solid white 1px;
    padding-bottom: 0.5rem;
  }
  .person-description {
    padding-top: 1rem;
    font-size: 14px;
    row-gap: 1rem;
    display: flex;
    flex-direction: column;
  }
`;
