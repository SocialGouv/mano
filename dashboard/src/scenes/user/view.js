import React, { useEffect, useState } from "react";
import { Container, Nav, NavItem, NavLink, TabContent, TabPane, FormGroup, Input, Label, Button, Row, Col } from "reactstrap";

import { useParams, Redirect } from "react-router-dom";
import { Formik } from "formik";
import { toastr } from "react-redux-toastr";

import api from "../../services/api";
import LoadingButton from "../../components/loadingButton";
import Header from "../../components/header";

import OrganisationTeamPicker from "./organisationTeamPicker";

export default () => {
  const [activeTab, setActiveTab] = useState("1");
  const [user, setUser] = useState(null);
  const [deleted, setDeleted] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    (async () => {
      const { user: u } = await api.get(`/user/${id}`);
      setUser(u);
    })();
  }, []);

  async function deleteData() {
    const confirm = window.confirm("Are you sure ?");
    if (confirm) {
      await api.remove(`/users/${id}`);
      setDeleted(true);
      toastr.success("successfully removed!");
    }
  }

  if (!user) return <div>Loading...</div>;
  if (deleted) return <Redirect to="/user" />;

  return (
    <div>
      <Header title={user.name} />

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
              initialValues={user}
              onSubmit={async (values) => {
                try {
                  await api.put(`/user/${user.id}`, values);
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
                    <Col md={6}>
                      <FormGroup>
                        <Label>Email</Label>
                        <Input name="email" value={values.email} onChange={handleChange} />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Role</Label>
                        <Input type="select" name="role" value={values.role} onChange={handleChange}>
                          <option value="NORMAL">Normal</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPERADMIN">SuperAdmin</option>
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>
                  <OrganisationTeamPicker value={values} onChange={handleChange} />
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
              {Object.keys(user).map((e) => (
                <div>
                  <strong>{e}:</strong> {JSON.stringify(user[e])}
                </div>
              ))}
            </pre>
          </TabPane>
        </TabContent>
      </Container>
    </div>
  );
};
