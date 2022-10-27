import React, { useMemo, useState } from 'react';
import { Col, Label, Row } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import { organisationState, userState } from '../../../recoil/auth';
import { actionsState, mappedIdsToLabels } from '../../../recoil/actions';
import UserName from '../../../components/UserName';
import { populatedPersonSelector, filteredPersonActionsSelector } from '../selectors/selectors';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import CreateActionModal from '../../../components/CreateActionModal';
import ButtonCustom from '../../../components/ButtonCustom';
import SelectCustom from '../../../components/SelectCustom';
import ExclamationMarkButton from '../../../components/ExclamationMarkButton';
import DateBloc from '../../../components/DateBloc';
import { formatTime } from '../../../services/date';
import ActionStatus from '../../../components/ActionStatus';
import TagTeam from '../../../components/TagTeam';
import ActionName from '../../../components/ActionName';
import Table from '../../../components/table';

export const Actions = ({ person }) => {
  const data = person?.actions || [];
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);

  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);

  const catsSelect = ['-- Aucune --', ...(organisation.categories || [])];

  const filteredData = useRecoilValue(filteredPersonActionsSelector({ personId: person._id, filterCategories, filterStatus }));

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <h4 style={{ flex: '1' }}>Actions</h4>
        <ButtonCustom onClick={() => setModalOpen(true)} title="Créer une action" />
        <CreateActionModal person={person._id} open={modalOpen} setOpen={(value) => setModalOpen(value)} />
      </div>
      {data.length ? (
        <Row>
          <Col md={6}>
            <Label htmlFor="action-select-categories-filter">Filtrer par catégorie</Label>
            <SelectCustom
              options={catsSelect}
              inputId="action-select-categories-filter"
              name="categories"
              onChange={(c) => {
                setFilterCategories(c);
              }}
              isClearable
              isMulti
              getOptionValue={(c) => c}
              getOptionLabel={(c) => c}
            />
          </Col>
          <Col md={6}>
            <Label htmlFor="action-select-status-filter">Filtrer par statut</Label>
            <SelectCustom
              inputId="action-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="status"
              onChange={(s) => setFilterStatus(s.map((s) => s._id))}
              isClearable
              isMulti
              value={mappedIdsToLabels.filter((s) => filterStatus.includes(s._id))}
            />
          </Col>
        </Row>
      ) : null}

      <table className="table table-striped">
        <tbody className="small">
          {filteredData.map((action, i) => (
            <tr>
              <td>
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flexGrow: 1 }}>{action.urgent ? <ExclamationMarkButton /> : null} Vendredi 29 Septembre 22:30</div>
                    <div>
                      <ActionStatus status={'A FAIRE'} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                    <div style={{ flexGrow: 1 }}>
                      <ActionName action={action} />
                    </div>
                    <div>
                      <TagTeam teamId={action.team} />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StyledTable = styled(Table)`
  table tr {
    height: 40px;
  }
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  span {
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 400;
    font-style: italic;
    display: block;
  }
`;
