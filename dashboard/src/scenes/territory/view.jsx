import React from "react";
import { Row, Col, FormGroup, Input, Label } from "reactstrap";
import { useParams, useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik } from "formik";

import { SmallHeaderWithBackButton } from "../../components/header";
import Loading from "../../components/loading";
import ButtonCustom from "../../components/ButtonCustom";

import Observations from "../territory-observations/list";
import SelectCustom from "../../components/SelectCustom";
import { territoryTypes, territoriesState, prepareTerritoryForEncryption } from "../../recoil/territory";
import { useRecoilState, useRecoilValue } from "recoil";
import API from "../../services/api";
import { territoryObservationsState } from "../../recoil/territoryObservations";
import useTitle from "../../services/useTitle";
import DeleteButtonAndConfirmModal from "../../components/DeleteButtonAndConfirmModal";
import { userState } from "../../recoil/auth";

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const user = useRecoilValue(userState);
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const territory = territories.find((t) => t._id === id);

  useTitle(`${territory?.name} - Territoire`);

  if (!territory) return <Loading />;

  return (
    <>
      <SmallHeaderWithBackButton />
      <Formik
        initialValues={territory}
        enableReinitialize
        onSubmit={async (body) => {
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
            toast.success("Mis à jour !");
          }
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting }) => {
          return (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="name">Nom</Label>
                    <Input name="name" id="name" value={values.name} onChange={handleChange} readOnly={user.role === "restricted-access"} />
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
                      isDisabled={user.role === "restricted-access"}
                    />
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="perimeter">Périmètre</Label>
                    <Input
                      name="perimeter"
                      id="perimeter"
                      value={values.perimeter}
                      onChange={handleChange}
                      readOnly={user.role === "restricted-access"}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                {!["restricted-access"].includes(user.role) && (
                  <>
                    <DeleteButtonAndConfirmModal
                      title={`Voulez-vous vraiment supprimer le territoire ${territory.name}`}
                      textToConfirm={territory.name}
                      onConfirm={async () => {
                        const res = await API.delete({ path: `/territory/${id}` });
                        if (res.ok) {
                          setTerritories((territories) => territories.filter((t) => t._id !== id));
                          for (let obs of territoryObservations.filter((o) => o.territory === id)) {
                            const res = await API.delete({ path: `/territory-observation/${obs._id}` });
                            if (res.ok) {
                              setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== obs._id));
                            }
                          }
                          toast.success("Suppression réussie");
                          history.goBack();
                        }
                      }}
                    >
                      <span style={{ marginBottom: 30, display: "block", width: "100%", textAlign: "center" }}>
                        Cette opération est irréversible
                        <br />
                        et entrainera la suppression définitive de toutes les observations liées au territoire.
                      </span>
                    </DeleteButtonAndConfirmModal>
                    <ButtonCustom title={"Mettre à jour"} loading={isSubmitting} onClick={handleSubmit} />
                  </>
                )}
              </div>
            </React.Fragment>
          );
        }}
      </Formik>
      <Observations territory={territory || { _id: id }} />
    </>
  );
};

export default View;
