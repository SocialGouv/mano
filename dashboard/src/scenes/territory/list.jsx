import React, { useMemo, useState } from "react";
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from "reactstrap";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik } from "formik";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useLocalStorage } from "../../services/useLocalStorage";
import { SmallHeader } from "../../components/header";
import Page from "../../components/pagination";
import Loading from "../../components/loading";
import Table from "../../components/table";
import ButtonCustom from "../../components/ButtonCustom";
import Search from "../../components/search";
import { territoryTypes, territoriesState, prepareTerritoryForEncryption, sortTerritories } from "../../recoil/territory";
import SelectCustom from "../../components/SelectCustom";
import { onlyFilledObservationsTerritories } from "../../recoil/selectors";
import { currentTeamState, organisationState, userState } from "../../recoil/auth";
import { formatDateWithFullMonth } from "../../services/date";
import API from "../../services/api";
import { filterBySearch } from "../search/utils";
import useTitle from "../../services/useTitle";
import useSearchParamState from "../../services/useSearchParamState";
import { useDataLoader } from "../../components/DataLoader";

const List = () => {
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();
  useTitle("Territoires");
  useDataLoader({ refreshOnMount: true });

  const [page, setPage] = useSearchParamState("page", 0);
  const [search, setSearch] = useSearchParamState("search", "");

  const territories = useRecoilValue(territoriesState);
  const territoryObservations = useRecoilValue(onlyFilledObservationsTerritories);
  const [sortBy, setSortBy] = useLocalStorage("territory-sortBy", "name");
  const [sortOrder, setSortOrder] = useLocalStorage("territory-sortOrder", "ASC");

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
          <CreateTerritory />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: "1px solid #ddd" }}>
        <Col md={12} style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <label htmlFor="search" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
            Recherche&nbsp;:{" "}
          </label>
          <Search placeholder="Par mot clé, présent dans le nom, une observation, ..." value={search} onChange={setSearch} />
        </Col>
      </Row>
      <Table
        data={data}
        rowKey={"_id"}
        onRowClick={(territory) => history.push(`/territory/${territory._id}`)}
        columns={[
          {
            title: "Nom",
            dataKey: "name",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (territory) => {
              return (
                <div className="[overflow-wrap:anywhere]">
                  <b>{territory.name}</b>
                </div>
              );
            },
          },
          {
            title: "Types",
            dataKey: "types",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: ({ types }) => (types ? types.join(", ") : ""),
          },
          {
            title: "Périmètre",
            dataKey: "perimeter",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
          },
          {
            title: "Créé le",
            dataKey: "createdAt",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (territory) => formatDateWithFullMonth(territory.createdAt || ""),
          },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </>
  );
};

export const CreateTerritory = () => {
  const [open, setOpen] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);

  return (
    <div className="tw-flex tw-w-full tw-justify-end">
      {!["restricted-access"].includes(user.role) && (
        <ButtonCustom
          disabled={!currentTeam?._id}
          onClick={() => setOpen(true)}
          color="primary"
          title="Créer un nouveau territoire"
          padding="12px 24px"
        />
      )}
      <TerritoryModal open={open} setOpen={setOpen} />
    </div>
  );
};

export function TerritoryModal({ open, setOpen, territory = {} }) {
  const history = useHistory();
  const setTerritories = useSetRecoilState(territoriesState);
  const user = useRecoilValue(userState);
  const isNew = !territory._id;
  const initialValues = { name: "", types: [], perimeter: "", description: "", ...territory };

  return (
    <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
      <ModalHeader toggle={() => setOpen(false)}>Créer un nouveau territoire</ModalHeader>
      <ModalBody>
        <Formik
          initialValues={initialValues}
          onSubmit={async (body, actions) => {
            if (!body.name) return toast.error("Le nom est obligatoire");

            if (isNew) {
              const res = await API.post({ path: "/territory", body: prepareTerritoryForEncryption({ ...body, user: user._id }) });
              if (res.ok) {
                setTerritories((territories) => [res.decryptedData, ...territories]);
                actions.setSubmitting(false);
                toast.success("Création réussie !");
                setOpen(false);
                history.push(`/territory/${res.data._id}`);
              }
            } else {
              const res = await API.put({
                path: `/territory/${territory._id}`,
                body: prepareTerritoryForEncryption({ ...body, user: body.user || user._id }),
              });
              if (res.ok) {
                setTerritories((territories) =>
                  territories.map((a) => {
                    if (a._id === territory._id) return res.decryptedData;
                    return a;
                  })
                );
                actions.setSubmitting(false);
                toast.success("Mis à jour !");
                setOpen(false);
              }
            }
          }}
        >
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
                      options={territoryTypes.map((_option) => ({ value: _option, label: _option }))}
                      name="types"
                      onChange={(values) => handleChange({ currentTarget: { value: values.map((v) => v.value), name: "types" } })}
                      isClearable={false}
                      isMulti
                      value={values.types?.map((_option) => ({ value: _option, label: _option })) || []}
                      getOptionValue={(i) => i.value}
                      getOptionLabel={(i) => i.label}
                      inputId="territory-select-types"
                      classNamePrefix="territory-select-types"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input name="description" id="description" value={values.description} onChange={handleChange} type="textarea" rows={3} />
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
              <div className="tw-mt-2 tw-flex tw-justify-end">
                <ButtonCustom disabled={isSubmitting} onClick={handleSubmit} title="Sauvegarder" />
              </div>
            </React.Fragment>
          )}
        </Formik>
      </ModalBody>
    </Modal>
  );
}

export default List;
