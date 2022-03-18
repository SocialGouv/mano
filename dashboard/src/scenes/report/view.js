/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { Col, Nav, NavItem, NavLink, Row, TabContent, TabPane, FormGroup, Label } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';
import {
  addOneDay,
  formatDateTimeWithNameOfDay,
  formatDateWithFullMonth,
  formatTime,
  getIsDayWithinHoursOffsetOfDay,
  getIsDayWithinHoursOffsetOfPeriod,
  startOfToday,
} from '../../services/date';
import DateBloc from '../../components/DateBloc';
import { SmallerHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import BackButton, { BackButtonWrapper } from '../../components/backButton';
import Box from '../../components/Box';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import CreateAction from '../action/CreateAction';
import Observation from '../territory-observations/view';
import dayjs from 'dayjs';
import { actionsState, CANCEL, DONE } from '../../recoil/actions';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { capture } from '../../services/sentry';
import UserName from '../../components/UserName';
import ButtonCustom from '../../components/ButtonCustom';
import Card from '../../components/Card';
import CreateObservation from '../../components/CreateObservation';
import SelectAndCreateCollaboration from './SelectAndCreateCollaboration';
import ActionName from '../../components/ActionName';
import ReportDescriptionModale from '../../components/ReportDescriptionModale';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import { personsState } from '../../recoil/persons';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import PersonName from '../../components/PersonName';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentTeamReportsSelector } from '../../recoil/selectors';
import Incrementor from '../../components/Incrementor';
import { refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';
import { passagesState } from '../../recoil/passages';
import Passage from '../../components/Passage';

const tabs = ['Accueil', 'Actions complétées', 'Actions créées', 'Actions annulées', 'Commentaires', 'Passages', 'Observations'];

const getPeriodTitle = (date, nightSession) => {
  if (!nightSession) return `Journée du ${formatDateWithFullMonth(date)}`;
  const nextDay = addOneDay(date);
  return `Nuit du ${formatDateWithFullMonth(date)} au ${formatDateWithFullMonth(nextDay)}`;
};
// MIGRATION TODO
const View = () => {
  const { id } = useParams();
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const currentTeamReports = useRecoilValue(currentTeamReportsSelector);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);

  const setReports = useSetRecoilState(reportsState);
  const location = useLocation();
  const history = useHistory();
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(Number(searchParams.get('tab') || (!!organisation.receptionEnabled ? 0 : 1)));
  const [tabsContents, setTabsContents] = useState(tabs);
  const API = useApi();

  const reportIndex = currentTeamReports.findIndex((r) => r._id === id);

  const report = currentTeamReports[reportIndex];

  const onFirstBeforeReport = () => {
    if (reportIndex === currentTeamReports.length - 1) return;
    const prevReport = currentTeamReports[reportIndex + 1];
    if (!prevReport) return;
    history.push(`/report/${prevReport._id}`);
  };
  const onFirstLaterReport = () => {
    if (reportIndex === 0) return;
    const nextReport = currentTeamReports[reportIndex - 1];
    if (!nextReport) return;
    history.push(`/report/${nextReport._id}`);
  };

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/report/${id}` });
      if (res.ok) {
        setReports((reports) => reports.filter((p) => p._id !== id));
        toastr.success('Suppression réussie');
        history.goBack();
      }
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

  const renderPrintOnly = () => {
    if (process.env.REACT_APP_TEST === 'true') return null;
    return (
      <div className="printonly">
        <div style={{ fontSize: 24, lineHeight: '32px', fontWeight: 'bold', padding: '16px 32px' }}>
          {`Compte rendu de l'équipe ${currentTeam?.name || ''}`}
          <br />
          {getPeriodTitle(report.date, currentTeam?.nightSession)}
        </div>
        <DescriptionAndCollaborations report={report} key={report._id} />
        <Reception report={report} />
        <ActionCompletedAt date={report.date} status={DONE} />
        <ActionCreatedAt date={report.date} />
        <ActionCompletedAt date={report.date} status={CANCEL} />
        <CommentCreatedAt date={report.date} />
        <PassagesCreatedAt date={report.date} report={report} />
        <TerritoryObservationsCreatedAt date={report.date} />
      </div>
    );
  };

  const renderScreenOnly = () => (
    <div className="noprint">
      <SmallerHeaderWithBackButton
        style={{ width: '100%', padding: 0 }}
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
                  title="Rafraichir"
                  onClick={() =>
                    setRefreshTrigger({
                      status: true,
                      options: { initialLoad: false, showFullScreen: false },
                    })
                  }
                />
                <ButtonCustom
                  color="link"
                  className="noprint"
                  title="Précédent"
                  disabled={reportIndex === currentTeamReports.length - 1}
                  onClick={onFirstBeforeReport}
                />
                <ButtonCustom color="link" className="noprint" title="Suivant" disabled={reportIndex === 0} onClick={onFirstLaterReport} />
              </div>
            </div>
            <div>
              {`Compte rendu de l'équipe ${currentTeam?.name || ''}`}
              <br />
              {getPeriodTitle(report.date, currentTeam?.nightSession)}
            </div>
          </div>
        }
      />
      <div className="noprint">
        <DescriptionAndCollaborations report={report} key={report._id} />
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
                    history.replace({ pathname: location.pathname, search: searchParams.toString() });
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
            <PassagesCreatedAt date={report.date} report={report} onUpdateResults={(total) => updateTabContent(5, `Passages (${total})`)} />
          </TabPane>
          <TabPane tabId={6}>
            <TerritoryObservationsCreatedAt date={report.date} onUpdateResults={(total) => updateTabContent(6, `Observations (${total})`)} />
          </TabPane>
        </TabContent>
      </div>
    </div>
  );

  return (
    <>
      {renderPrintOnly()}
      {renderScreenOnly()}
    </>
  );
};

const Reception = ({ report }) => {
  const organisation = useRecoilValue(organisationState);

  const setReports = useSetRecoilState(reportsState);
  const API = useApi();

  const services = report?.services?.length ? JSON.parse(report?.services) : {};

  const onServiceUpdate = async (service, newCount) => {
    const reportUpdate = {
      ...report,
      services: JSON.stringify({
        ...services,
        [service]: newCount,
      }),
    };
    const res = await API.put({ path: `/report/${report._id}`, body: prepareReportForEncryption(reportUpdate) });
    if (res.ok) {
      setReports((reports) =>
        reports.map((a) => {
          if (a._id === report._id) return res.decryptedData;
          return a;
        })
      );
    }
  };

  if (!organisation.receptionEnabled) return null;

  const renderServices = () => {
    if (!organisation.services) return null;
    const services = JSON.parse(report.services || '{}') || {};
    return (
      <>
        {organisation?.services?.map((service) => (
          <Incrementor key={service} service={service} count={services[service] || 0} onChange={(newCount) => onServiceUpdate(service, newCount)} />
        ))}
      </>
    );
  };

  return (
    <StyledBox>
      <TabTitle>Services effectués ce jour</TabTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', margin: '20px 0', flexShrink: 0, gap: 5, justifyContent: 'space-evenly' }}>
        {renderServices()}
      </div>
    </StyledBox>
  );
};

const ActionCompletedAt = ({ date, status, onUpdateResults = () => null }) => {
  const history = useHistory();
  const currentTeam = useRecoilValue(currentTeamState);
  const allActions = useRecoilValue(actionsState);

  const data = allActions
    ?.filter((a) => a.team === currentTeam._id)
    .filter((a) => a.status === status)
    .filter((a) => getIsDayWithinHoursOffsetOfDay(a.completedAt, date, currentTeam?.nightSession ? 12 : 0));

  useEffect(() => {
    onUpdateResults(data.length);
  }, [date]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  const completedAt = startOfToday().add(12, 'hours');

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
          title={`Action${moreThanOne ? 's' : ''} ${status === CANCEL ? 'annulée' : 'faite'}${moreThanOne ? 's' : ''} le ${formatDateWithFullMonth(
            date
          )}`}
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
                return formatTime(action.dueAt);
              },
            },
            { title: 'Nom', dataKey: 'name', render: (action) => <ActionName action={action} /> },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              render: (action) => <PersonName item={action} />,
            },
            { title: 'Créée le', dataKey: 'createdAt', render: (action) => formatDateWithFullMonth(action.createdAt || '') },
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

  const currentTeam = useRecoilValue(currentTeamState);
  const actions = useRecoilValue(actionsState);

  const data = actions
    ?.filter((a) => a.team === currentTeam._id)
    .filter((a) => getIsDayWithinHoursOffsetOfDay(a.createdAt, date, currentTeam?.nightSession ? 12 : 0))
    .filter((a) => !getIsDayWithinHoursOffsetOfDay(a.completedAt, date, currentTeam?.nightSession ? 12 : 0));

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
          title={`Action${moreThanOne ? 's' : ''} créée${moreThanOne ? 's' : ''} le ${formatDateWithFullMonth(date)}`}
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
                return formatTime(action.dueAt);
              },
            },
            { title: 'Nom', dataKey: 'name', render: (action) => <ActionName action={action} /> },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              render: (action) => <PersonName item={action} />,
            },
            { title: 'Créée le', dataKey: 'createdAt', render: (action) => formatDateWithFullMonth(action.createdAt) },
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

  const comments = useRecoilValue(commentsState);
  const persons = useRecoilValue(personsState);
  const actions = useRecoilValue(actionsState);
  const currentTeam = useRecoilValue(currentTeamState);

  const data = comments
    .filter((c) => c.team === currentTeam._id)
    .filter((c) => getIsDayWithinHoursOffsetOfDay(c.createdAt, date, currentTeam?.nightSession ? 12 : 0))
    .filter((c) => !c.comment.includes('Passage enregistré'))
    .map((comment) => {
      const commentPopulated = { ...comment };
      if (comment.person) {
        const id = comment?.person || comment?.item;
        commentPopulated.person = persons.find((p) => p._id === id);
        commentPopulated.type = 'person';
      }
      if (comment.action) {
        const id = comment?.action || comment?.item;
        const action = actions.find((p) => p._id === id);
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
          title={`Commentaires ajoutés le ${formatDateWithFullMonth(date)}`}
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

const PassagesCreatedAt = ({ date, report, onUpdateResults = () => null }) => {
  const allPassages = useRecoilValue(passagesState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [passageToEdit, setPassageToEdit] = useState(null);

  const passages = useMemo(
    () =>
      allPassages
        .filter((p) => p.team === currentTeam._id)
        .filter((p) =>
          getIsDayWithinHoursOffsetOfPeriod(
            p.date,
            {
              referenceStartDay: date,
              referenceEndDay: date,
            },
            currentTeam?.nightSession ? 12 : 0
          )
        ),
    [date, allPassages]
  );

  useEffect(() => {
    onUpdateResults(passages.length);
  }, [passages.length]);

  const numberOfAnonymousPassages = useMemo(() => passages.filter((p) => !p.person)?.length, [passages]);
  const numberOfNonAnonymousPassages = useMemo(() => passages.filter((p) => !!p.person)?.length, [passages]);

  return (
    <>
      <StyledBox>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <TabTitle>Passages enregistrés le {formatDateWithFullMonth(date)}</TabTitle>
          <ButtonCustom
            title="Ajouter un passage ce jour"
            style={{ marginLeft: 'auto', marginBottom: '10px' }}
            onClick={() =>
              setPassageToEdit({
                date: dayjs(date),
                user: user._id,
                team: currentTeam._id,
              })
            }
          />
        </div>
        <Row style={{ marginBottom: 20 }}>
          <Col md={2} />
          <Col md={4}>
            <Card
              countId="report-passages-anonymous-count"
              title="Nombre de passages anonymes"
              count={numberOfAnonymousPassages}
              unit={`passage${numberOfAnonymousPassages > 1 ? 's' : ''}`}
            />
          </Col>
          <Col md={4}>
            <Card
              countId="report-passages-non-anonymous-count"
              title="Nombre de passages non-anonymes"
              count={numberOfNonAnonymousPassages}
              unit={`passage${numberOfNonAnonymousPassages > 1 ? 's' : ''}`}
            />
          </Col>
        </Row>
        <Passage passage={passageToEdit} onFinished={() => setPassageToEdit(null)} />
        {!!passages.length && (
          <Table
            className="Table"
            onRowClick={setPassageToEdit}
            data={passages}
            rowKey={'_id'}
            columns={[
              {
                title: 'Heure',
                dataKey: 'date',
                render: (passage) => {
                  const time = dayjs(passage.date).format('HH:mm');
                  // anonymous comment migrated from `report.passages`
                  // have no time
                  // have no user assigned either
                  if (time === '00:00' && !passage.user) return null;
                  return <span>{time}</span>;
                },
              },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (passage) =>
                  passage.person ? (
                    <PersonName item={passage} redirectToTab="passages" />
                  ) : (
                    <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>
                  ),
              },
              {
                title: 'Enregistré par',
                dataKey: 'user',
                render: (passage) => (passage.user ? <UserName id={passage.user} /> : null),
              },
              { title: 'Commentaire', dataKey: 'comment' },
            ]}
          />
        )}
      </StyledBox>
    </>
  );
};

const TerritoryObservationsCreatedAt = ({ date, onUpdateResults = () => null }) => {
  const [observation, setObservation] = useState({});
  const [openObservationModale, setOpenObservationModale] = useState(null);

  const currentTeam = useRecoilValue(currentTeamState);
  const territories = useRecoilValue(territoriesState);
  const territoryObservations = useRecoilValue(territoryObservationsState);

  const data = territoryObservations
    .filter((o) => o.team === currentTeam._id)
    .filter((o) => getIsDayWithinHoursOffsetOfDay(o.createdAt, date, currentTeam?.nightSession ? 12 : 0));

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
          title={`Observation${moreThanOne ? 's' : ''} de territoire${moreThanOne ? 's' : ''} faite${
            moreThanOne ? 's' : ''
          } le ${formatDateWithFullMonth(date)}`}
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

const DescriptionAndCollaborations = ({ report }) => {
  const setReports = useSetRecoilState(reportsState);
  const API = useApi();

  return (
    <>
      <DescriptionBox className="noprint" report={report}>
        <Formik
          className="noprint"
          initialValues={report}
          onSubmit={async (body) => {
            const reportUpdate = {
              ...report,
              ...body,
            };
            const res = await API.put({ path: `/report/${report._id}`, body: prepareReportForEncryption(reportUpdate) });
            if (res.ok) {
              setReports((reports) =>
                reports.map((a) => {
                  if (a._id === report._id) return res.decryptedData;
                  return a;
                })
              );
              toastr.success('Mis à jour !');
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <Row>
              <Col md={5}>
                <FormGroup>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: report?.description?.length ? 'row' : 'column',
                      alignItems: report?.description?.length ? 'center' : 'flex-start',
                      justifyContent: 'flex-start',
                    }}>
                    <Label>Description</Label>
                    <ReportDescriptionModale report={report} />
                  </div>
                  <p>
                    {report?.description?.split('\n').map((sentence, index) => (
                      <React.Fragment key={index}>
                        {sentence}
                        <br />
                      </React.Fragment>
                    ))}
                  </p>
                </FormGroup>
              </Col>
              <Col md={2} />
              <Col md={5}>
                <FormGroup>
                  <Label>Collaboration</Label>
                  <SelectAndCreateCollaboration values={values.collaborations} onChange={handleChange} />
                </FormGroup>
              </Col>
              <Col md={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ButtonCustom
                  title={'Mettre à jour'}
                  loading={isSubmitting}
                  disabled={JSON.stringify(report.collaborations) === JSON.stringify(values.collaborations)}
                  onClick={handleSubmit}
                  width={200}
                />
              </Col>
            </Row>
          )}
        </Formik>
      </DescriptionBox>
      {process.env.REACT_APP_TEST !== 'true' && (
        <DescriptionBox className="printonly" report={report}>
          {!!report?.collaborations?.length && (
            <>
              <Title>Collaboration{report.collaborations.length > 1 ? 's' : ''}</Title>
              <p>{report?.collaborations.join(', ')}</p>
            </>
          )}
          <Title>Description</Title>
          <p>
            {!report?.description
              ? 'Pas de description'
              : report?.description?.split('\n').map((sentence, index) => (
                  <React.Fragment key={index}>
                    {sentence}
                    <br />
                  </React.Fragment>
                ))}
          </p>
        </DescriptionBox>
      )}
    </>
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
  padding: 16px 0;
  display: block;
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
    margin-top: 10px;
    margin-bottom: 40px;
  }
  @media print {
    ${(props) => props.report?.description?.length < 1 && props.report?.collaborations?.length < 1 && 'display: none !important;'}
    margin-bottom: 40px;
    page-break-inside: avoid;
  }
`;

export default View;
