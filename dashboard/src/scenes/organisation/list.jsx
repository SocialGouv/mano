import React, { useEffect, useState } from "react";
import { ModalBody, ModalHeader, ModalFooter, ModalContainer } from "../../components/tailwind/Modal";
import { Formik } from "formik";
import { toast } from "react-toastify";
import styled from "styled-components";
import Table from "../../components/table";
import OrganisationUsers from "./OrganisationUsers";
import Loading from "../../components/loading";
import API from "../../services/api";
import { formatAge, formatDateWithFullMonth } from "../../services/date";
import useTitle from "../../services/useTitle";
import DeleteButtonAndConfirmModal from "../../components/DeleteButtonAndConfirmModal";
import { capture } from "../../services/sentry";
import { useRecoilValue } from "recoil";
import { userState } from "../../recoil/auth";
import { download, emailRegex } from "../../utils";
import SelectRole from "../../components/SelectRole";
import SelectCustom from "../../components/SelectCustom";
import OrganisationSuperadminSettings from "./OrganisationSuperadminSettings";
import { getUmapGeoJSONFromOrgs } from "./utils";
import CitySelect from "../../components/CitySelect";

const List = () => {
  const [organisations, setOrganisations] = useState(null);
  const user = useRecoilValue(userState);
  const [updateKey, setUpdateKey] = useState(null);
  const [sortBy, setSortBy] = useState("countersTotal");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [refresh, setRefresh] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openOrgSettingsModal, setOpenOrgSettingsModal] = useState(false);
  const [openCreateUserModal, setOpenCreateUserModal] = useState(false);
  const [openUserListModal, setOpenUserListModal] = useState(false);
  const [selectedOrganisation, setSelectedOrganisation] = useState(null);

  useTitle("Organisations");

  useEffect(() => {
    (async () => {
      if (!refresh) return;
      const { data } = await API.get({ path: "/organisation", query: { withCounters: true } });
      const sortedDataAscendant = data?.sort((org1, org2) => (org1[sortBy] > org2[sortBy] ? 1 : -1));
      setOrganisations(sortOrder === "ASC" ? sortedDataAscendant : [...(sortedDataAscendant || [])].reverse());
      setUpdateKey((k) => k + 1);
      setRefresh(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    const sortedDataAscendant = organisations?.sort((org1, org2) => (org1[sortBy] > org2[sortBy] ? 1 : -1));
    setOrganisations(sortOrder === "ASC" ? sortedDataAscendant : [...(sortedDataAscendant || [])].reverse());
    setUpdateKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  const total = organisations?.length;

  return (
    <>
      <Create onChange={() => setRefresh(true)} open={openCreateModal} setOpen={setOpenCreateModal} />
      <OrganisationUsers
        open={openUserListModal}
        organisation={selectedOrganisation}
        setOpen={setOpenUserListModal}
        setOpenCreateUserModal={setOpenCreateUserModal}
        openCreateUserModal={openCreateUserModal}
      />
      <OrganisationSuperadminSettings
        key={selectedOrganisation?._id}
        organisation={selectedOrganisation}
        open={openOrgSettingsModal}
        setOpen={setOpenOrgSettingsModal}
        updateOrganisation={(nextOrg) => {
          setOrganisations(
            organisations.map((orga) => {
              if (orga._id !== nextOrg._id) return orga;
              return {
                ...orga,
                ...nextOrg,
              };
            })
          );
        }}
      />
      <CreateUser onChange={() => setRefresh(true)} open={openCreateUserModal} setOpen={setOpenCreateUserModal} organisation={selectedOrganisation} />
      <div className="tw-mb-10 tw-mt-4 tw-flex tw-w-full tw-justify-between">
        <h2 className="tw-text-2xl">Organisations utilisant Mano ({total})</h2>
        <div>
          <button
            className="button-classic"
            type="button"
            onClick={() => {
              const geoJson = JSON.stringify(getUmapGeoJSONFromOrgs(organisations), null, 2);
              // download
              const blob = new Blob([geoJson], { type: "application/json" });
              download(blob, "villes-utilisatrices-de-mano_umap.geojson");
            }}
          >
            Exporter les villes vers umap
          </button>
          <button className="button-submit" type="button" onClick={() => setOpenCreateModal(true)}>
            Créer une nouvelle organisation
          </button>
        </div>
      </div>
      {!organisations?.length ? (
        refresh ? (
          <Loading />
        ) : null
      ) : (
        <Table
          data={organisations}
          key={updateKey}
          columns={[
            {
              title: "Nom",
              dataKey: "name",
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (o) => (
                <div>
                  {o.name}
                  <br />
                  <small className="tw-text-gray-500">ID: {o.orgId}</small>
                  <br />
                  <small className="tw-text-gray-500">Ville: {o.city?.split?.(" - ")?.[0]}</small>
                </div>
              ),
            },
            {
              title: "Créée le",
              dataKey: "createdAt",
              render: (o) => (
                <div>
                  {formatDateWithFullMonth(o.createdAt || "")}
                  <br />
                  <small className="tw-text-gray-500">il y a {o.createdAt ? formatAge(o.createdAt) : "un certain temps"}</small>
                </div>
              ),
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
            },
            {
              title: "Utilisateurs",
              dataKey: "users",
              sortableKey: "users",
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (o) => {
                return <span>Utilisateurs: {o.users || 0}</span>;
              },
            },
            {
              title: "Compteurs",
              dataKey: "counters",
              sortableKey: "countersTotal",
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (o) => {
                return (
                  <StyledCounters total={o.countersTotal}>
                    <span>Personnes: {o.counters.persons || 0}</span>
                    <br />
                    <span>Familles: {o.counters.groups || 0}</span>
                    <br />
                    <span>Actions: {o.counters.actions || 0}</span>
                    <br />
                    <span>Passages: {o.counters.passages || 0}</span>
                    <br />
                    <span>Rencontres: {o.counters.rencontres || 0}</span>
                    <br />
                    <span>Territoires: {o.counters.territories || 0}</span>
                    <br />
                    <span>Observations: {o.counters.observations || 0}</span>
                    <br />
                    <span>Comptes-rendus: {o.counters.reports || 0}</span>
                    <br />
                    <span>Collaborations: {o.counters.collaborations || 0}</span>
                    <br />
                    <span>Commentaires: {o.counters.comments || 0}</span>
                    <br />
                    <span>Consultations: {o.counters.consultations || 0}</span>
                    <br />
                    <span>Traitements: {o.counters.treatments || 0}</span>
                  </StyledCounters>
                );
              },
            },
            {
              title: "Dernier chiffrement",
              dataKey: "encryptionLastUpdateAt",
              sortBy,
              sortOrder,
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              render: (o) => (
                <div>
                  {o.encryptionLastUpdateAt ? formatDateWithFullMonth(o.encryptionLastUpdateAt) : "Pas encore chiffrée"}
                  <br />
                  <small className="tw-text-gray-500">{o.encryptionLastUpdateAt ? "il y a " + formatAge(o.encryptionLastUpdateAt) : ""}</small>
                </div>
              ),
            },
            {
              title: "Action",
              dataKey: "delete",
              render: (organisation) => {
                return (
                  <div className="tw-flex-col tw-flex tw-gap-y-2">
                    <div>
                      <button
                        className="button-classic"
                        type="button"
                        onClick={() => {
                          setSelectedOrganisation(organisation);
                          setOpenOrgSettingsModal(true);
                        }}
                      >
                        Modifier l'organisation
                      </button>
                    </div>
                    <div>
                      <button
                        className="button-classic"
                        type="button"
                        onClick={() => {
                          setSelectedOrganisation(organisation);
                          setOpenUserListModal(true);
                        }}
                      >
                        Voir les utilisateurs
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrganisation(organisation);
                          setOpenCreateUserModal(true);
                        }}
                        className="button-classic tw-text-left"
                      >
                        Ajouter un utilisateur
                      </button>
                    </div>
                    <div>
                      <DeleteButtonAndConfirmModal
                        title={`Voulez-vous vraiment supprimer l'organisation ${organisation.name}`}
                        textToConfirm={organisation.name}
                        onConfirm={async () => {
                          try {
                            const res = await API.delete({ path: `/organisation/${organisation._id}` });
                            if (res.ok) {
                              toast.success("Organisation supprimée");
                              setRefresh(true);
                            }
                          } catch (organisationDeleteError) {
                            capture(organisationDeleteError, { extra: { organisation }, user });
                            toast.error(organisationDeleteError.message);
                          }
                        }}
                      >
                        <span style={{ marginBottom: 30, display: "block", width: "100%", textAlign: "center" }}>
                          Cette opération est irréversible
                          <br />
                          et entrainera la suppression définitive de toutes les données liées à l’organisation&nbsp;:
                          <br />
                          équipes, utilisateurs, personnes suivies, actions, territoires, commentaires et observations, comptes-rendus...
                        </span>
                      </DeleteButtonAndConfirmModal>
                    </div>
                  </div>
                );
              },
            },
          ]}
          rowKey={"_id"}
          onRowClick={null}
        />
      )}
    </>
  );
};

const StyledCounters = styled.p`
  ${(p) => p.total < 10 && "opacity: 0.5;"}
  ${(p) => p.total === 0 && "opacity: 0.1;"}
  ${(p) => p.total > 200 && "font-weight: 500;"}
  ${(p) => p.total > 2000 && "font-weight: 600;"}
  ${(p) => p.total > 5000 && "font-weight: 700;"}
  ${(p) => p.total > 10000 && "font-weight: 800;"}
`;

const Create = ({ onChange, open, setOpen }) => {
  return (
    <>
      <ModalContainer open={open} onClose={() => setOpen(false)} size="3xl" blurryBackground>
        <ModalHeader title="Créer une nouvelle organisation et un administrateur" />
        <Formik
          initialValues={{ orgName: "", name: "", email: "", orgId: "", city: "" }}
          validate={(values) => {
            const errors = {};
            if (!values.name) errors.name = "Le nom est obligatoire";
            if (!values.orgName) errors.orgName = "Le nom de l'organisation est obligatoire";
            if (!values.orgId) errors.orgId = "L'identifiant est obligatoire";
            if (!values.city) errors.city = "La ville est obligatoire";
            if (!values.email) errors.email = "L'email est obligatoire";
            else if (!emailRegex.test(values.email)) errors.email = "L'email est invalide";
            return errors;
          }}
          onSubmit={async (body, actions) => {
            try {
              const orgRes = await API.post({ path: "/organisation", body });
              actions.setSubmitting(false);
              if (!orgRes.ok) return;
              toast.success("Création réussie !");
              onChange();
              setOpen(false);
            } catch (orgCreationError) {
              console.log("error in creating organisation", orgCreationError);
              toast.error(orgCreationError.message);
            }
          }}
        >
          {({ values, handleChange, handleSubmit, isSubmitting, touched, errors }) => (
            <>
              <ModalBody className="tw-px-4 tw-py-2 tw-pb-20">
                <React.Fragment>
                  <div className="-tw-mx-4 tw-flex tw-flex-row tw-flex-wrap">
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="orgName">Nom</label>
                        <input className="tailwindui" name="orgName" id="orgName" value={values.orgName} onChange={handleChange} />
                        {touched.orgName && errors.orgName && <span className="tw-text-xs tw-text-red-500">{errors.orgName}</span>}
                      </div>
                    </div>
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="orgName">
                          Identifiant interne <small>(non modifiable)</small>
                        </label>
                        <input className="tailwindui" name="orgId" id="orgId" value={values.orgId} onChange={handleChange} />
                        {touched.orgId && errors.orgId && <span className="tw-text-xs tw-text-red-500">{errors.orgId}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="-tw-mx-4 tw-flex tw-flex-row tw-flex-wrap">
                    <div className="tw-flex tw-basis-full tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="organisation-create-city">Ville</label>
                        <CitySelect
                          name="city"
                          id="organisation-create-city"
                          value={values.city}
                          onChange={(nextCity) => {
                            handleChange({ target: { name: "city", value: nextCity } });
                          }}
                        />
                        {touched.city && errors.city && <span className="tw-text-xs tw-text-red-500">{errors.city}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="-tw-mx-4 tw-flex tw-flex-row tw-flex-wrap">
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="name">Nom de l’administrateur</label>
                        <input className="tailwindui" name="name" id="name" value={values.name} onChange={handleChange} />
                        {touched.name && errors.name && <span className="tw-text-xs tw-text-red-500">{errors.name}</span>}
                      </div>
                    </div>
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="email">Email de l’administrateur</label>
                        <input className="tailwindui" name="email" id="email" value={values.email} onChange={handleChange} />
                        {touched.email && errors.email && <span className="tw-text-xs tw-text-red-500">{errors.email}</span>}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              </ModalBody>
              <ModalFooter>
                <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button className="button-submit" onClick={handleSubmit}>
                  Créer
                </button>
              </ModalFooter>
            </>
          )}
        </Formik>
      </ModalContainer>
    </>
  );
};

const CreateUser = ({ onChange, open, setOpen, organisation }) => {
  const [team, setTeam] = useState([]);
  useEffect(() => {
    if (!organisation?._id) return;
    (async () => {
      const { data } = await API.get({ path: `organisation/${organisation._id}/teams` });
      setTeam(data);
    })();
  }, [organisation?._id]);

  if (!organisation) return;

  return (
    <>
      <ModalContainer open={open} onClose={() => setOpen(false)} size="3xl" blurryBackground>
        <Formik
          initialValues={{ name: "", email: "", phone: "", team, healthcareProfessional: false }}
          onSubmit={async (body, actions) => {
            try {
              if (!body.email) return toast.error("L'email est obligatoire");
              if (!emailRegex.test(body.email)) return toast.error("L'email est invalide");
              if (!body.role) return toast.error("Le rôle est obligatoire");

              body.organisation = organisation._id;
              const { ok } = await API.post({ path: "/user", body });
              if (!ok) {
                return false;
              }
              toast.success("Création réussie !");
              onChange();
              setOpen(false);
            } catch (orgCreationError) {
              console.log("error in creating organisation", orgCreationError);
              actions.setSubmitting(false);
              toast.error(orgCreationError.message);
            }
          }}
        >
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <>
              <ModalHeader title={`Créer un utilisateur pour ${organisation.orgId}`} />
              <ModalBody className="tw-px-4 tw-py-2 tw-pb-20">
                <React.Fragment>
                  <div className="-tw-mx-4 tw-flex tw-flex-row tw-flex-wrap">
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="name">Nom</label>
                        <input className="tailwindui" name="name" id="name" value={values.name} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="email">Email</label>
                        <input className="tailwindui" type="email" name="email" id="email" value={values.email} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="phone">Téléphone</label>
                        <input className="tailwindui" type="tel" name="phone" id="phone" value={values.phone} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="team">Équipes</label>
                        <div>
                          <SelectCustom
                            name="name"
                            options={team}
                            onChange={(teams) => handleChange({ target: { value: teams?.map((t) => t._id) || [], name: "team" } })}
                            value={values.team.map((_teamId) => team.find((_team) => _team._id === _teamId))}
                            getOptionValue={(team) => team._id}
                            getOptionLabel={(team) => team.name}
                            isMulti
                            isDisabled={team.length === 0}
                            inputId="team"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                      <div className="tw-mb-4">
                        <label htmlFor="role">Role</label>
                        <SelectRole handleChange={handleChange} value={values.role} />
                      </div>
                    </div>
                    <div className="tw-flex tw-basis-full tw-flex-col tw-px-4 tw-py-2">
                      <label htmlFor="healthcareProfessional" className="tw-mb-0">
                        <input
                          type="checkbox"
                          className="tw-mr-2"
                          name="healthcareProfessional"
                          id="healthcareProfessional"
                          checked={values.healthcareProfessional}
                          onChange={() => {
                            handleChange({
                              target: {
                                name: "healthcareProfessional",
                                checked: Boolean(!values.healthcareProfessional),
                                value: Boolean(!values.healthcareProfessional),
                              },
                            });
                          }}
                        />
                        Professionnel·le de santé
                      </label>
                      <div>
                        <small className="text-muted">Un professionnel·le de santé a accès au dossier médical complet des personnes.</small>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              </ModalBody>
              <ModalFooter>
                <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button className="button-submit" onClick={handleSubmit}>
                  Créer
                </button>
              </ModalFooter>
            </>
          )}
        </Formik>
      </ModalContainer>
    </>
  );
};
export default List;
