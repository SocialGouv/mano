import { theme } from '../../../config';
import { dayjsInstance } from '../../../services/date';
import styled from 'styled-components';

export function InfosMain({ person }) {
  return (
    <Container>
      <div className="card">
        <div className="card-body">
          <div className="person-name">
            <b>{person.name}</b>
            {person.otherNames && <span> ({person.otherNames})</span>}
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
              {dayjsInstance(person.wanderingAt || person.createdAt).format('DD/MM/YYYY')}
            </div>
            <div>
              <b>Téléphone : </b>
              {person.phone}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

const Container = styled.div`
  .card {
    background-color: ${theme.main};
    height: 350px;
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
    padding-bottom: 1rem;
  }
  .person-description {
    padding-top: 1rem;
    font-size: 14px;
    row-gap: 1rem;
    display: flex;
    flex-direction: column;
  }
`;
