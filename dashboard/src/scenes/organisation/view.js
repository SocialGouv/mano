import React, { useEffect, useState } from "react";
import { Container, Nav, NavItem, NavLink, TabContent, TabPane, FormGroup, Input, Label, Button, Row, Col } from "reactstrap";

import { useParams, Redirect } from "react-router-dom";
import { Formik } from "formik";
import { toastr } from "react-redux-toastr";

import api from "../../services/api";
import LoadingButton from "../../components/loadingButton";
import Header from "../../components/header";

export default () => {
  const [activeTab, setActiveTab] = useState("1");
  const [organisation, setOrganisation] = useState(null);
  const [deleted, setDeleted] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/organisation/${id}`);
      setOrganisation(data);
    })();
  }, []);

  async function deleteData() {
    const confirm = window.confirm("Are you sure ?");
    if (confirm) {
      await api.remove(`/organisation/${id}`);
      setDeleted(true);
      toastr.success("successfully removed!");
    }
  }

  if (!organisation) return <div>Loading...</div>;

  if (deleted) return <Redirect to="/organisation" />;

  return (
    <div>
      <Header title={organisation.name} />

      <Container style={{ padding: "40px 0" }}>
        <Nav tabs style={{ marginBottom: 30 }}>
          <NavItem>
            <NavLink style={{ backgroundColor: activeTab === "1" && "#eee" }} onClick={() => setActiveTab("1")}>
              View
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink style={{ backgroundColor: activeTab === "2" && "#eee" }} onClick={() => setActiveTab("2")}>
              Raw
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="1">
            <Formik
              initialValues={organisation}
              onSubmit={async (values) => {
                try {
                  await api.put(`/organisation?organisation_id=${organisation._id}`, values);
                  toastr.success("Updated!");
                } catch (e) {
                  console.log(e);
                  toastr.error("Some Error!");
                }
              }}
            >
              {({ values, handleChange, handleSubmit, isSubmitting }) => (
                <React.Fragment>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Name</Label>
                        <Input name="name" value={values.name} onChange={handleChange} />
                      </FormGroup>
                    </Col>
                  </Row>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <LoadingButton loading={isSubmitting} color="info" onClick={handleSubmit}>
                      Update
                    </LoadingButton>
                    <Button style={{ marginLeft: 10 }} color="danger" onClick={deleteData}>
                      Delete
                    </Button>
                  </div>
                </React.Fragment>
              )}
            </Formik>
          </TabPane>
          <TabPane tabId="2">
            <pre>
              {Object.keys(organisation).map((e) => (
                <div>
                  <strong>{e}:</strong> {JSON.stringify(organisation[e])}
                </div>
              ))}
            </pre>
          </TabPane>
        </TabContent>
      </Container>
    </div>
  );
};
