import React, { useMemo, useState } from 'react';
import { Col, Button as LinkButton, Row, Modal, ModalBody, ModalHeader } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useLocalStorage } from 'react-use';
import { SmallHeader } from '../../components/header';
import Page from '../../components/pagination';
import Loading from '../../components/loading';
import Table from '../../components/table';
import ButtonCustom from '../../components/ButtonCustom';
import Search from '../../components/search';
import { territoriesState, sortTerritories, usePrepareTerritoryForEncryption, territoryEncryptedFieldsSelector } from '../../recoil/territory';
import { onlyFilledObservationsTerritories } from '../../recoil/selectors';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { formatDateWithFullMonth } from '../../services/date';
import useApi from '../../services/api';
import { filterBySearch } from '../search/utils';
import useTitle from '../../services/useTitle';
import useSearchParamState from '../../services/useSearchParamState';
import { useDataLoader } from '../../components/DataLoader';
import CustomFieldInput from '../../components/CustomFieldInput';

const List = () => {
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();
  useTitle('Territoires');
  useDataLoader({ refreshOnMount: true });

  const [page, setPage] = useSearchParamState('page', 0);
  const [search, setSearch] = useSearchParamState('search', '');

  const territories = useRecoilValue(territoriesState);
  const territoryObservations = useRecoilValue(onlyFilledObservationsTerritories);
  const [sortBy, setSortBy] = useLocalStorage('territory-sortBy', 'name');
  const [sortOrder, setSortOrder] = useLocalStorage('territory-sortOrder', 'ASC');

  const filteredTerritories = useMemo(() => {
    if (!search.length) return [...territories].sort(sortTerritories(sortBy, sortOrder));
    const territoriesIdsByTerritoriesSearch = filterBySearch(search, territories).map((t) => t._id);
    const territoriesIdsFilteredByObsSearch = filterBySearch(search, territoryObservations).map((obs) => obs.territory);

    const territoriesIdsFilterBySearch = [...new Set([...territoriesIdsByTerritoriesSearch, ...territoriesIdsFilteredByObsSearch])];
    return territories.filter((t) => territoriesIdsFilterBySearch.includes(t._id)).sort(sortTerritories(sortBy, sortOrder));
  }, [territoryObservations, territories, search, sortBy, sortOrder]);

  const limit = 20;
  const data = useMemo(
    () => filteredTerritories?.filter((_, index) => index < (page + 1) * limit && index >= page * limit),
    [filteredTerritories, page, limit]
  );
  const total = filteredTerritories?.length;

  if (!territories) return <Loading />;

  return (
    <>
      <SmallHeader
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
          {
            title: 'Nom',
            dataKey: 'name',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
          },
          {
            title: 'Types',
            dataKey: 'types',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: ({ types }) => (types ? types.join(', ') : ''),
          },
          {
            title: 'Périmètre',
            dataKey: 'perimeter',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
          },
          {
            title: 'Créé le',
            dataKey: 'createdAt',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (territory) => formatDateWithFullMonth(territory.createdAt || ''),
          },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </>
  );
};

const CreateTerritory = () => {
  const [open, setOpen] = useState(false);
  const history = useHistory();
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const API = useApi();
  const setTerritories = useSetRecoilState(territoriesState);
  const { refresh, isLoading } = useDataLoader();
  const prepareTerritoryForEncryption = usePrepareTerritoryForEncryption();
  const territoryFields = useRecoilValue(territoryEncryptedFieldsSelector);

  return (
    <CreateStyle>
      <LinkButton disabled={isLoading} onClick={() => refresh} color="link" style={{ marginRight: 10 }}>
        Rafraichir
      </LinkButton>
      <ButtonCustom
        disabled={!currentTeam?._id}
        onClick={() => setOpen(true)}
        color="primary"
        title="Créer un nouveau territoire"
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setOpen(false)}>Créer un nouveau territoire</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', types: [], perimeter: '' }}
            onSubmit={async (body, actions) => {
              if (!body.name) return toast.error('Le nom est obligatoire');
              const res = await API.post({ path: '/territory', body: prepareTerritoryForEncryption({ ...body, user: user._id }) });
              if (res.ok) {
                setTerritories((territories) => [res.decryptedData, ...territories]);
              }
              actions.setSubmitting(false);
              if (res.ok) {
                toast.success('Création réussie !');
                setOpen(false);
                history.push(`/territory/${res.data._id}`);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <CustomFieldInput
                    field={{ type: 'text', label: 'Nom', name: 'name' }}
                    colWidth={6}
                    model="territory"
                    name="name"
                    values={values}
                    handleChange={handleChange}
                  />
                  {territoryFields
                    .filter((f) => !['name', 'user'].includes(f.name))
                    .map((field) => (
                      <CustomFieldInput
                        key={field.name}
                        field={field}
                        colWidth={6}
                        model="territory"
                        name={field.name}
                        values={values}
                        handleChange={handleChange}
                      />
                    ))}
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
