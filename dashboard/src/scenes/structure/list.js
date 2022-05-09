import React, { useEffect, useState } from 'react';
import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { SmallerHeaderWithBackButton } from '../../components/header';
import Page from '../../components/pagination';
import Loading from '../../components/loading';
import Table from '../../components/table';
import CreateWrapper from '../../components/createWrapper';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import ButtonCustom from '../../components/ButtonCustom';
import Search from '../../components/search';
import { currentTeamState } from '../../recoil/auth';
import useApi from '../../services/api';
import { formatDateWithFullMonth } from '../../services/date';
import useTitle from '../../services/useTitle';

const List = () => {
  const [structures, setStructures] = useState(null);
  const history = useHistory();
  const [pagination, setPagination] = useState();
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState('');
  useTitle('Structures');
  const API = useApi();

  useEffect(() => {
    setPagination({});
    getStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, search]);

  const getStructure = async (p = pagination) => {
    const { data, page } = await API.get({ path: '/structure', query: { search, ...p } });
    setStructures(data);
    setPagination(page);
  };

  if (!structures) return <Loading />;

  return (
    <>
      <SmallerHeaderWithBackButton titleStyle={{ fontWeight: 400 }} title="Structures" />
      <Row style={{ marginBottom: 20 }}>
        <Col>
          <Create onChange={() => setRefresh(true)} />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="search" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
            Recherche :{' '}
          </label>
          <Search placeholder="Par nom de la structure" value={search} onChange={setSearch} />
        </Col>
      </Row>
      <Table
        data={structures}
        rowKey={'_id'}
        onRowClick={(i) => history.push(`/structure/${i._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Créée le', dataKey: 'createdAt', render: (i) => formatDateWithFullMonth(i.createdAt) },
        ]}
      />
      <Page {...pagination} onChange={getStructure} />
    </>
  );
};

const Create = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const API = useApi();

  return (
    <CreateWrapper style={{ marginBottom: 0 }}>
      <ButtonCustom
        disabled={!currentTeam?._id}
        onClick={() => setOpen(true)}
        color="primary"
        title="Créer une nouvelle structure"
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer une structure</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (body, actions) => {
              try {
                const res = await API.post({ path: '/structure', body });
                actions.setSubmitting(false);
                if (res.ok) {
                  toastr.success('Création réussie !');
                  onChange();
                  setOpen(false);
                }
              } catch (errorCreatingStructure) {
                console.log('error in creating structure', errorCreatingStructure);
                toastr.error('Erreur!', errorCreatingStructure.message);
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
                </Row>
                <br />
                <ButtonCustom loading={isSubmitting} onClick={handleSubmit} title="Créer" />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateWrapper>
  );
};

export default List;
