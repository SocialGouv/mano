import React from 'react';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import UserName from '../../components/UserName';
import { customFieldsObsSelector } from '../../recoil/territoryObservations';
import CustomFieldDisplay from '../../components/CustomFieldDisplay';
import { currentTeamState } from '../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../services/date';
import TagTeam from '../../components/TagTeam';

const fieldIsEmpty = (value) => {
  if (value === null) return true;
  if (value === undefined) return true;
  if (typeof value === 'string' && !value.length) return true;
  if (Array.isArray(value) && !value.length) return true;
  return false;
};

const View = ({ obs, onDelete, onClick, noBorder, noTeams }) => {
  const team = useRecoilValue(currentTeamState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

  return (
    <StyledObservation noBorder={noBorder}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <UserName id={obs.user} wrapper={(name) => <span className="author">{name}</span>} />
        {!noTeams && (
          <div style={{ marginLeft: 150 }}>
            <TagTeam teamId={obs?.team} />
          </div>
        )}
      </div>
      <div className="time">{formatDateTimeWithNameOfDay(obs.observedAt || obs.createdAt)}</div>
      <div onClick={onClick ? () => onClick(obs) : null} className="content">
        {customFieldsObs
          .filter((f) => f)
          .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
          .map((field) => {
            const { name, label } = field;
            return (
              <Item key={name} fieldIsEmpty={fieldIsEmpty(obs[name])}>
                {label}: <CustomFieldDisplay field={field} value={obs[field.name]} />
              </Item>
            );
          })}
      </div>
      {!!onDelete && (
        <button className="tw-text-xs tw-text-red-500 hover:tw-underline" onClick={() => onDelete(obs._id)}>
          Supprimer l'observation
        </button>
      )}
    </StyledObservation>
  );
};

const Item = styled.span`
  display: inline-block;
  ${(props) => props.fieldIsEmpty && 'opacity: 0.25;'}
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
