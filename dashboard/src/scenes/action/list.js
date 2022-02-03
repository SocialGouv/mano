/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';

import Header from '../../components/header';
import Page from '../../components/pagination';
import SelectStatus from '../../components/SelectStatus';
import Loading from '../../components/loading';
import CreateAction from './CreateAction';
import Table from '../../components/table';
import ActionStatus from '../../components/ActionStatus';

import DateBloc from '../../components/DateBloc';

import PaginationContext from '../../contexts/pagination';
import Search from '../../components/search';
import { actionsFullSearchSelector } from '../../recoil/selectors';
import ActionsCalendar from '../../components/ActionsCalendar';
import SelectCustom from '../../components/SelectCustom';
import ActionName from '../../components/ActionName';
import { currentTeamState } from '../../recoil/auth';
import { useRecoilState, useRecoilValue } from 'recoil';
import ActionPersonName from '../../components/ActionPersonName';
import { formatDateWithFullMonth, formatTime } from '../../services/date';

const showAsOptions = ['Calendrier', 'Liste'];

const List = () => {
  const [currentTeam] = useRecoilState(currentTeamState);

  const { search, setSearch, status, setStatus, page, setPage } = useContext(PaginationContext);
  const history = useHistory();
  const location = useLocation();

  const [showAs, setShowAs] = useState(new URLSearchParams(location.search)?.get('showAs') || showAsOptions[0]); // calendar, list

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('showAs', showAs);
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
  }, [showAs]);

  const actionsFiltered = useRecoilValue(actionsFullSearchSelector({ status, search }));
  const limit = 20;

  if (!actionsFiltered) return <Loading />;

  const data = actionsFiltered.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  const total = actionsFiltered.length;

  return (
    <Container>
      <Header
        titleStyle={{ fontWeight: '400' }}
        title={
          <span>
            Actions de l'équipe <b>{currentTeam?.name || ''}</b>
          </span>
        }
      />
      <Row style={{ marginBottom: 40, justifyContent: 'center' }}>
        <Col>
          <CreateAction disabled={!currentTeam} isMulti refreshable />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Recherche : </span>
          <Search placeholder="Par mot clé, présent dans le nom, la catégorie, un commentaire, ..." value={search} onChange={setSearch} />
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Filtrer par status : </span>
          <div style={{ width: 300 }}>
            <SelectStatus noTitle onChange={(event) => setStatus(event.target.value)} value={status} />
          </div>
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Afficher par : </span>
          <div style={{ width: 300 }}>
            <SelectCustom
              onChange={setShowAs}
              value={[showAs]}
              options={showAsOptions}
              isClearable={false}
              isMulti={false}
              getOptionValue={(i) => i}
              getOptionLabel={(i) => i}
            />
          </div>
        </Col>
      </Row>
      {showAs === showAsOptions[0] && (
        <div style={{ minHeight: '100vh' }}>
          {' '}
          <ActionsCalendar actions={actionsFiltered} />
        </div>
      )}
      {showAs === showAsOptions[1] && (
        <>
          <Table
            data={data}
            rowKey={'_id'}
            onRowClick={(action) => history.push(`/action/${action._id}`)}
            columns={[
              {
                title: 'À faire le',
                dataKey: 'dueAt' || '_id',
                render: (action) => {
                  return <DateBloc date={action.dueAt} withTime={action.withTime} />;
                },
              },
              {
                title: 'Heure',
                dataKey: '_id',
                render: (action) => {
                  if (!action.dueAt || !action.withTime) return null;
                  return formatTime(action.dueAt);
                },
              },
              {
                title: 'Nom',
                dataKey: 'name',
                render: (action) => <ActionName action={action} />,
              },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (action) => <ActionPersonName action={action} />,
              },
              { title: 'Créée le', dataKey: 'createdAt', render: (action) => formatDateWithFullMonth(action.createdAt || '') },
              { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
            ]}
          />
          <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
        </>
      )}
    </Container>
  );
};

export default List;
