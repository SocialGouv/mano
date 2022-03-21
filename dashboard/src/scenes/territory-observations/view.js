import React from 'react';
import styled from 'styled-components';
import { Button as CloseButton } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import UserName from '../../components/UserName';
import { customFieldsObsSelector } from '../../recoil/territoryObservations';
import CustomFieldDisplay from '../../components/CustomFieldDisplay';
import { teamsState } from '../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../services/date';

const fieldIsEmpty = (value) => {
  if (value === null) return true;
  if (value === undefined) return true;
  if (typeof value === 'string' && !value.length) return true;
  if (Array.isArray(value) && !value.length) return true;
  return false;
};

const View = ({ obs, onDelete, onClick, noBorder }) => {
  const teams = useRecoilValue(teamsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

  return (
    <StyledObservation noBorder={noBorder}>
      {!!onDelete && <CloseButton close onClick={() => onDelete(obs._id)} />}
      <div style={{ display: 'flex' }}>
        <UserName id={obs.user} wrapper={(name) => <span className="author">{name}</span>} />
        <i style={{ marginLeft: 10 }}>(équipe {teams.find((t) => obs.team === t._id)?.name})</i>
      </div>
      <div className="time">{formatDateTimeWithNameOfDay(obs.createdAt)}</div>
      <div onClick={onClick ? () => onClick(obs) : null} className="content">
        {customFieldsObs
          .filter((f) => f)
          .filter((f) => f.enabled)
          .map((field) => {
            const { name, label } = field;
            return (
              <Item key={name} fieldIsEmpty={fieldIsEmpty(obs[name])}>
                {label}: <CustomFieldDisplay field={field} value={obs[field.name]} />
              </Item>
            );
          })}
      </div>
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
