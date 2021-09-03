/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { Col, Container, Input, Nav, NavItem, NavLink, Row, TabContent, TabPane, Button as LinkButton } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';

import { toFrenchDate } from '../../utils';
import DateBloc from '../../components/DateBloc';
import Header from '../../components/header';
import Loading from '../../components/loading';
import BackButton, { BackButtonWrapper } from '../../components/backButton';
import Box from '../../components/Box';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import CreateAction from '../action/CreateAction';
import Observation from '../territory-observations/view';
import dayjs from 'dayjs';
import AuthContext from '../../contexts/auth';
import ActionsContext, { CANCEL, DONE } from '../../contexts/actions';
import CommentsContext from '../../contexts/comments';
import PersonsContext from '../../contexts/persons';
import TerritoryObservationsContext from '../../contexts/territoryObservations';
import TerritoryContext from '../../contexts/territory';
import { capture } from '../../services/sentry';
import ReportsContext from '../../contexts/reports';
import UserName from '../../components/UserName';
import ButtonCustom from '../../components/ButtonCustom';
import Card from '../../components/Card';
import CreateObservation from '../../components/CreateObservation';

const tabs = ['Accueil', 'Actions complétées', 'Actions créées', 'Actions annulées', 'Commentaires', 'Observations'];

const View = () => {
  const { id } = useParams();
  const { user, organisation, currentTeam } = useContext(AuthContext);
  const { reports, deleteReport } = useContext(ReportsContext);
  const location = useLocation();
  const history = useHistory();
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(Number(searchParams.get('tab') || !!organisation.receptionEnabled ? 0 : 1));
  const [tabsContents, setTabsContents] = useState(tabs);

  const reportIndex = reports.findIndex((r) => r._id === id);

  const report = reports[reportIndex];

  const onPreviousReport = () => {
    if (reportIndex === reports.length - 1) return;
    const prevReport = reports[reportIndex + 1];
    if (!prevReport) return;
    history.push(`/report/${prevReport._id}`);
  };
  const onNextReport = () => {
    if (reportIndex === 0) return;
    const nextReport = reports[reportIndex - 1];
    if (!nextReport) return;
    history.push(`/report/${nextReport._id}`);
  };

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await deleteReport(id);
      if (!res.ok) return;
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };
  const updateTabContent = (tabIndex, content) => setTabsContents((contents) => contents.map((c, index) => (index === tabIndex ? content : c)));

  useEffect(() => {
    if (report && report.team !== currentTeam._id) history.goBack();
  }, [currentTeam._id]);

  useEffect(() => {
    // for print use only
    document.title = `Compte rendu Mano - Organisation ${organisation.name} - ${report && dayjs(report.date).format('DD-MM-YYYY')} - imprimé par ${
      user.name
    }`;
    return () => {
      document.title = 'Mano - Admin';
    };
  });

  if (!report) return <Loading />;

  const renderPrintOnly = () => (
    <div className="printonly">
      <Description report={report} />
      <Reception report={report} />
      <ActionCompletedAt date={report.date} status={DONE} />
      <ActionCreatedAt date={report.date} />
      <ActionCompletedAt date={report.date} status={CANCEL} />
      <CommentCreatedAt date={report.date} />
      <TerritoryObservationsCreatedAt date={report.date} />
    </div>
  );

  const renderScreenOnly = () => (
    <div className="noprint">
      <Description report={report} />
      <Nav tabs fill style={{ marginBottom: 20 }}>
        {tabsContents.map((tabCaption, index) => {
          if (!organisation.receptionEnabled && index === 0) return null;
          return (
            <NavItem key={index} style={{ cursor: 'pointer' }}>
              <NavLink
                key={index}
                className={`${activeTab === index && 'active'}`}
                onClick={() => {
                  const searchParams = new URLSearchParams(location.search);
                  searchParams.set('tab', index);
                  history.push({ pathname: location.pathname, search: searchParams.toString() });
                  setActiveTab(index);
                }}>
                {tabCaption}
              </NavLink>
            </NavItem>
          );
        })}
      </Nav>
      <TabContent activeTab={activeTab}>
        {!!organisation.receptionEnabled && (
          <TabPane tabId={0}>
            <Reception report={report} />
          </TabPane>
        )}
        <TabPane tabId={1}>
          <ActionCompletedAt date={report.date} status={DONE} onUpdateResults={(total) => updateTabContent(1, `Actions complétées (${total})`)} />
        </TabPane>
        <TabPane tabId={2}>
          <ActionCreatedAt date={report.date} onUpdateResults={(total) => updateTabContent(2, `Actions créées (${total})`)} />
        </TabPane>
        <TabPane tabId={3}>
          <ActionCompletedAt date={report.date} status={CANCEL} onUpdateResults={(total) => updateTabContent(3, `Actions annulées (${total})`)} />
        </TabPane>
        <TabPane tabId={4}>
          <CommentCreatedAt date={report.date} onUpdateResults={(total) => updateTabContent(4, `Commentaires (${total})`)} />
        </TabPane>
        <TabPane tabId={5}>
          <TerritoryObservationsCreatedAt date={report.date} onUpdateResults={(total) => updateTabContent(5, `Observations (${total})`)} />
        </TabPane>
      </TabContent>
    </div>
  );

  return (
    <Container className="report-container" style={{ padding: '40px 0' }}>
      <Header
        style={{ width: '100%' }}
        titleStyle={{ width: '100%' }}
        title={
          <div style={{ minWidth: '100%', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex' }}>
                <BackButton />
                <BackButtonWrapper caption="Imprimer" onClick={window.print} />
                <BackButtonWrapper caption="Supprimer" onClick={deleteData} />
              </div>
              <div style={{ display: 'flex' }}>
                <ButtonCustom
                  color="link"
                  className="noprint"
                  title="Précédent"
                  disabled={reportIndex === reports.length - 1}
                  onClick={onPreviousReport}
                />
                <ButtonCustom color="link" className="noprint" title="Suivant" disabled={reportIndex === 0} onClick={onNextReport} />
              </div>
            </div>
            <div>{`Compte rendu du ${toFrenchDate(report.date)} de l'équipe ${currentTeam.name}`}</div>
          </div>
        }
      />
      {renderPrintOnly()}
      {renderScreenOnly()}
    </Container>
  );
};

const Reception = ({ report }) => {
  const { organisation } = useContext(AuthContext);

  if (!organisation.receptionEnabled) return null;

  const renderServices = () => {
    if (!report.services) return null;
    const services = JSON.parse(report.services) || {};
    return (
      <>
        {organisation.services.map((service) => (
          <Col md={4} key={service} style={{ marginBottom: 20 }}>
            <Card title={service} count={services[service] || 0} />
          </Col>
        ))}
      </>
    );
  };

  return (
    <StyledBox>
      <TabTitle>Accueil</TabTitle>
      <Row style={{ marginBottom: 20, flexShrink: 0 }}>
        <Col md={4} />
        <Col md={4} style={{ marginBottom: 20 }}>
          <Card title="Nombre de passages" count={report?.passages || 0} unit={`passage${report?.passages > 1 ? 's' : ''}`} />
        </Col>
        <Col md={4} />
        {renderServices()}
      </Row>
    </StyledBox>
  );
};

const ActionCompletedAt = ({ date, status, onUpdateResults = () => null }) => {
  const history = useHistory();
  const { actions: allActions } = useContext(ActionsContext);
  const { persons } = useContext(PersonsContext);
  const { currentTeam } = useContext(AuthContext);

  const data = allActions
    ?.filter((a) => a.team === currentTeam._id)
    .filter((a) => a.status === status)
    .filter((a) => a.completedAt?.slice(0, 10) === date.slice(0, 10))
    .map((action) => ({
      ...action,
      person: persons.find((p) => p._id === action.person),
    }));

  useEffect(() => {
    onUpdateResults(data.length);
  }, [date]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  const completedAt = new Date(date).setHours(12, 0, 0, 0);

  return (
    <>
      <StyledBox>
        {status === DONE && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CreateAction completedAt={completedAt} isMulti />
          </div>
        )}
        <Table
          className="Table"
          title={`Action${moreThanOne ? 's' : ''} ${status === CANCEL ? 'annulée' : 'faite'}${moreThanOne ? 's' : ''} le ${toFrenchDate(date)}`}
          noData={`Pas d'action ${status === CANCEL ? 'annulée' : 'faite'} ce jour`}
          data={data}
          onRowClick={(action) => history.push(`/action/${action._id}`)}
          rowKey="_id"
          columns={[
            { title: 'À faire le ', dataKey: 'dueAt', render: (action) => <DateBloc date={action.dueAt} /> },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return new Date(action.dueAt).toLocaleString('fr', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              },
            },
            { title: 'Nom', dataKey: 'name' },
            { title: 'Personne suivie', dataKey: 'person', render: (action) => <span>{action.person?.name || ''}</span> },
            { title: 'Créée le', dataKey: 'createdAt', render: (action) => toFrenchDate(action.createdAt || '') },
            { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const ActionCreatedAt = ({ date, onUpdateResults = () => null }) => {
  const history = useHistory();

  const { actions } = useContext(ActionsContext);
  const { currentTeam } = useContext(AuthContext);
  const { persons } = useContext(PersonsContext);

  const data = actions
    ?.filter((a) => a.team === currentTeam._id)
    .filter((a) => a.createdAt?.slice(0, 10) === date.slice(0, 10))
    .filter((a) => a.completedAt?.slice(0, 10) !== date.slice(0, 10))
    .map((action) => ({
      ...action,
      person: persons.find((p) => p._id === action.person),
    }));

  useEffect(() => {
    onUpdateResults(data.length);
  }, [date]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Action${moreThanOne ? 's' : ''} créée${moreThanOne ? 's' : ''} le ${toFrenchDate(date)}`}
          noData="Pas d'action créée ce jour"
          data={data}
          onRowClick={(action) => history.push(`/action/${action._id}`)}
          rowKey="_id"
          columns={[
            { title: 'À faire le ', dataKey: 'dueAt', render: (d) => <DateBloc date={d.dueAt} /> },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return new Date(action.dueAt).toLocaleString('fr', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              },
            },
            { title: 'Nom', dataKey: 'name' },
            { title: 'Personne suivie', dataKey: 'person', render: (action) => (action.person ? action.person.name : '') },
            { title: 'Créée le', dataKey: 'createdAt', render: (action) => toFrenchDate(action.createdAt) },
            { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const CommentCreatedAt = ({ date, onUpdateResults = () => null }) => {
  const history = useHistory();

  const { comments } = useContext(CommentsContext);
  const { persons } = useContext(PersonsContext);
  const { actions } = useContext(ActionsContext);
  const { currentTeam } = useContext(AuthContext);

  const data = comments
    .filter((c) => c.team === currentTeam._id)
    .filter((c) => c.createdAt.slice(0, 10) === date.slice(0, 10))
    .filter((c) => c.comment !== 'Passage enregistré')
    .map((comment) => {
      const commentPopulated = { ...comment };
      if (comment.person) {
        commentPopulated.person = persons.find((p) => p._id === comment?.person);
        commentPopulated.type = 'person';
      }
      if (comment.action) {
        const action = actions.find((p) => p._id === comment?.action);
        commentPopulated.action = action;
        commentPopulated.person = persons.find((p) => p._id === action?.person);
        commentPopulated.type = 'action';
      }
      return commentPopulated;
    });

  useEffect(() => {
    onUpdateResults(data.length);
  }, [date]);
  if (!data) return <div />;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Commentaires ajoutés le ${toFrenchDate(date)}`}
          data={data}
          noData="Pas de commentaire ajouté ce jour"
          onRowClick={(comment) => {
            try {
              history.push(`/${comment.type}/${comment[comment.type]._id}`);
            } catch (errorLoadingComment) {
              capture(errorLoadingComment, { extra: { message: 'error loading comment from report', comment, date } });
            }
          }}
          rowKey="_id"
          columns={[
            {
              title: 'Heure',
              dataKey: 'createdAt',
              render: (comment) => <span>{dayjs(comment.createdAt).format('HH:mm')}</span>,
            },
            {
              title: 'Utilisateur',
              dataKey: 'user',
              render: (comment) => <UserName id={comment.user} />,
            },
            {
              title: 'Type',
              dataKey: 'type',
              render: (comment) => <span>{comment.type === 'action' ? 'Action' : 'Personne suivie'}</span>,
            },
            {
              title: 'Nom',
              dataKey: 'person',
              render: (comment) => (
                <>
                  <b></b>
                  <b>{comment[comment.type]?.name}</b>
                  {comment.type === 'action' && (
                    <>
                      <br />
                      <i>(pour {comment.person?.name || ''})</i>
                    </>
                  )}
                </>
              ),
            },
            {
              title: 'Commentaire',
              dataKey: 'comment',
              render: (comment) => {
                return (
                  <p>
                    {comment.comment
                      ? comment.comment.split('\n').map((c, i, a) => {
                          if (i === a.length - 1) return c;
                          return (
                            <React.Fragment key={i}>
                              {c}
                              <br />
                            </React.Fragment>
                          );
                        })
                      : ''}
                  </p>
                );
              },
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const TerritoryObservationsCreatedAt = ({ date, onUpdateResults = () => null }) => {
  const [observation, setObservation] = useState({});
  const [openObservationModale, setOpenObservationModale] = useState(null);

  const { currentTeam } = useContext(AuthContext);
  const { territoryObservations } = useContext(TerritoryObservationsContext);
  const { territories } = useContext(TerritoryContext);

  const data = territoryObservations.filter((o) => o.team === currentTeam._id).filter((o) => o.createdAt.slice(0, 10) === date.slice(0, 10));

  useEffect(() => {
    onUpdateResults(data.length);
  }, [date]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Observation${moreThanOne ? 's' : ''} de territoire${moreThanOne ? 's' : ''} faite${moreThanOne ? 's' : ''} le ${toFrenchDate(
            date
          )}`}
          noData="Pas d'observation faite ce jour"
          data={data}
          onRowClick={(obs) => {
            setObservation(obs);
            setOpenObservationModale((k) => k + 1);
          }}
          rowKey="_id"
          columns={[
            {
              title: 'Heure',
              dataKey: 'createdAt',
              render: (obs) => <span>{dayjs(obs.createdAt).format('HH:mm')}</span>,
            },
            {
              title: 'Utilisateur',
              dataKey: 'user',
              render: (obs) => <UserName id={obs.user} />,
            },
            { title: 'Territoire', dataKey: 'territory', render: (obs) => territories.find((t) => t._id === obs.territory)?.name },
            { title: 'Observation', dataKey: 'entityKey', render: (obs) => <Observation noBorder obs={obs} />, left: true },
          ]}
        />
      </StyledBox>
      <CreateObservation observation={observation} forceOpen={openObservationModale} />
      <hr />
    </>
  );
};

const Description = ({ report }) => {
  const [description, setDescription] = useState(report.description || '');
  const [editable, setEditable] = useState(false);
  const [saving, setSaving] = useState(false);
  const { updateReport } = useContext(ReportsContext);

  useEffect(() => {
    setDescription(report.description || '');
  }, [report.description]);

  const onSave = async () => {
    const reportUpdate = {
      ...report,
      description,
    };
    setSaving(true);
    const res = await updateReport(reportUpdate);
    setSaving(false);
    if (res.ok) {
      toastr.success('Mis à jour !');
    }
  };

  if (editable) {
    return (
      <DescriptionBox description={description}>
        <Title>Description</Title>
        <Input className="noprint" type="textarea" name="text" value={description} onChange={(v) => setDescription(v.target.value)} />
        <ButtonCustom className="noprint" loading={saving} color="primary" onClick={onSave} style={{ marginTop: '10px' }} title="Sauvegarder" />
        <ButtonCustom
          className="noprint"
          loading={saving}
          color="secondary"
          onClick={() => setEditable(false)}
          style={{ marginTop: '10px' }}
          title="Annuler"
        />
      </DescriptionBox>
    );
  }

  return (
    <DescriptionBox description={description} onClick={() => setEditable(true)}>
      <Title>
        Description
        <LinkButton color="link" style={{ marginLeft: 30 }}>
          Modifier
        </LinkButton>
      </Title>
      <p dangerouslySetInnerHTML={{ __html: description.split('\n').join('<br />') || 'Pas de description' }} />
    </DescriptionBox>
  );
};

const Title = styled.h3`
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
  padding: 20px 0 10px 0;
  width: 100%;

  button {
    font-style: italic;
  }
`;

const TabTitle = styled.span`
  caption-side: top;
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
  width: 100%;
  color: #1d2021;
  text-transform: none;
  padding: 16px;
  @media print {
    display: block !important;
  }
`;

const StyledBox = styled(Box)`
  border-radius: 16px;
  padding: 16px 32px;
  @media print {
    margin-bottom: 15px;
  }

  .Table {
    padding: 0;
  }
`;

const DescriptionBox = styled(StyledBox)`
  @media screen {
    padding: 0;
    margin-top: -40px;
    margin-bottom: 40px;
  }
  @media print {
    ${(props) => props.description.length < 1 && 'display: none !important;'}
    margin-bottom: 40px;
    page-break-inside: avoid;
  }
`;

export default View;
