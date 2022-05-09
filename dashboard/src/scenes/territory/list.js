import React, { useMemo, useState } from 'react';
import { Col, Button as LinkButton, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { SmallerHeaderWithBackButton } from '../../components/header';
import Page from '../../components/pagination';
import Loading from '../../components/loading';
import Table from '../../components/table';
import ButtonCustom from '../../components/ButtonCustom';
import Search from '../../components/search';
import { territoryTypes, territoriesState, prepareTerritoryForEncryption } from '../../recoil/territory';
import SelectCustom from '../../components/SelectCustom';
import { onlyFilledObservationsTerritories } from '../../recoil/selectors';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { formatDateWithFullMonth } from '../../services/date';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import useApi from '../../services/api';
import { filterBySearch } from '../search/utils';
import useTitle from '../../services/useTitle';
import useSearchParamState from '../../services/useSearchParamState';

const List = () => {
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();
  useTitle('Territoires');

  const [page, setPage] = useSearchParamState('page', 0);
  const [search, setSearch] = useSearchParamState('search', '');

  const territories = useRecoilValue(territoriesState);
  const territoryObservations = useRecoilValue(onlyFilledObservationsTerritories);

  const filteredTerritories = useMemo(() => {
    if (!search.length) return territories;
    const territoriesIdsByTerritoriesSearch = filterBySearch(search, territories).map((t) => t._id);
    const territoriesIdsFilteredByObsSearch = filterBySearch(search, territoryObservations).map((obs) => obs.territory);

    const territoriesIdsFilterBySearch = [...new Set([...territoriesIdsByTerritoriesSearch, ...territoriesIdsFilteredByObsSearch])];
    return territories.filter((t) => territoriesIdsFilterBySearch.includes(t._id));
  }, [territoryObservations, territories, search]);

  const limit = 20;
  const data = useMemo(
    () => filteredTerritories?.filter((_, index) => index < (page + 1) * limit && index >= page * limit),
    [filteredTerritories, page, limit]
  );
  const total = filteredTerritories?.length;

  if (!territories) return <Loading />;

  return (
    <>
      <SmallerHeaderWithBackButton
        titleStyle={{ fontWeight: 400 }}
        title={
          <>
            Territoires de l'organisation <b>{organisation.name}</b>
          </>
        }
      />
      <Row style={{ marginBottom: 40 }}>
        <Col>
          <CreateTerritory organisation={organisation} />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="search" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
            Recherche :{' '}
          </label>
          <Search placeholder="Par mot clé, présent dans le nom, une observation, ..." value={search} onChange={setSearch} />
        </Col>
      </Row>
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(territory) => history.push(`/territory/${territory._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Types', dataKey: 'types', render: ({ types }) => (types ? types.join(', ') : '') },
          { title: 'Périmètre', dataKey: 'perimeter' },
          { title: 'Créé le', dataKey: 'createdAt', render: (territory) => formatDateWithFullMonth(territory.createdAt || '') },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </>
  );
};

const CreateTerritory = () => {
  const [open, setOpen] = useState(false);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const history = useHistory();
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const API = useApi();
  const loading = useRecoilValue(loadingState);
  const setTerritories = useSetRecoilState(territoriesState);

  return (
    <CreateStyle>
      <LinkButton
        disabled={!!loading}
        onClick={() => {
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          });
        }}
        color="link"
        style={{ marginRight: 10 }}>
        Rafraichir
      </LinkButton>
      <ButtonCustom
        disabled={!currentTeam?._id}
        onClick={() => setOpen(true)}
        color="primary"
        title="Créer un nouveau territoire"
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer un nouveau territoire</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', types: [], perimeter: '' }}
            onSubmit={async (body, actions) => {
              const res = await API.post({ path: '/territory', body: prepareTerritoryForEncryption({ ...body, user: user._id }) });
              if (res.ok) {
                setTerritories((territories) => [res.decryptedData, ...territories]);
              }
              actions.setSubmitting(false);
              if (res.ok) {
                toastr.success('Création réussie !');
                setOpen(false);
                history.push(`/territory/${res.data._id}`);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="name">Nom</Label>
                      <Input name="name" id="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="territory-select-types">Types</Label>
                      <SelectCustom
                        options={territoryTypes}
                        name="types"
                        onChange={(v) => handleChange({ currentTarget: { value: v, name: 'types' } })}
                        isClearable={false}
                        isMulti
                        value={values.types}
                        getOptionValue={(i) => i}
                        getOptionLabel={(i) => i}
                        inputId="territory-select-types"
                        classNamePrefix="territory-select-types"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="perimeter">Périmètre</Label>
                      <Input name="perimeter" id="perimeter" value={values.perimeter} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom disabled={isSubmitting} onClick={handleSubmit} title="Sauvegarder" />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateStyle>
  );
};

const CreateStyle = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export default List;
