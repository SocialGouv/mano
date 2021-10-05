import React, { useContext } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Button as CloseButton } from 'reactstrap';
import AuthContext from '../../contexts/auth';
import UserName from '../../components/UserName';
import TerritoryObservationsContext from '../../contexts/territoryObservations';

const View = ({ obs, onDelete, onClick, noBorder }) => {
  const { teams } = useContext(AuthContext);
  const { customFieldsObs } = useContext(TerritoryObservationsContext);

  return (
    <StyledObservation noBorder={noBorder}>
      {!!onDelete && <CloseButton close onClick={() => onDelete(obs._id)} />}
      <div style={{ display: 'flex' }}>
        <UserName id={obs.user} wrapper={(name) => <span className="author">{name}</span>} />
        <i style={{ marginLeft: 10 }}>(équipe {teams.find((t) => obs.team === t._id)?.name})</i>
      </div>
      <div className="time">{dayjs(obs.createdAt).format('MMM DD, YYYY | hh:mm A')}</div>
      <div onClick={onClick ? () => onClick(obs) : null} className="content">
        {customFieldsObs.map(({ name, label }) => {
          console.log(obs, name, obs[name]);
          return (
            <Item filledUp={!!obs[name]}>
              {label}: {obs[name]}
            </Item>
          );
        })}
        <Item></Item>
      </div>
    </StyledObservation>
  );
};

const Item = styled.span`
  display: block;
  ${(props) => !props.filledUp && 'opacity: 0.25;'}
`;

const StyledObservation = styled.div`
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  ${(props) => !props.noBorder && 'border-top: 1px solid #cacaca;'}
  .author {
    font-weight: bold;
    color: #0056b3;
  }
  .territory {
    font-weight: bold;
    /* font-size: 1.2em; */
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-top: 8px;
    font-style: italic;
    &:hover {
      cursor: pointer;
    }
  }
  .time {
    font-size: 10px;
    color: #9b9999;
    font-style: italic;
  }
`;

export default View;
