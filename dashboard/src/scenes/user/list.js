import React, { useEffect, useState } from "react";
import { Container, Table, Modal, ModalHeader, ModalBody, Button, Row, Col, FormGroup, Input } from "reactstrap";
import { useHistory } from "react-router-dom";
import { Formik } from "formik";
import { toastr } from "react-redux-toastr";

import LoadingButton from "../../components/loadingButton";
import Header from "../../components/header";

import OrganisationTeamPicker from "./organisationTeamPicker";

import api from "../../services/api";

export default () => {
  const [users, setUser] = useState(null);
  const history = useHistory();
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { users: u } = await api.get("/user/list");
        setUser(u);
      } catch (e) {
        console.log("e", e);
      }
    })();
  }, [refresh]);

  if (!users) return <div>loading...</div>;

  return (
    <div>
      <Header title="Users" />
      <Container style={{ padding: "40px 0" }}>
        <Create onChange={() => setRefresh(true)} />
        <Table hover>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Organisation</th>
              <th>Equipe</th>
              <th>Crée le</th>
              <th>Dernière connexion le</th>
            </tr>
          </thead>
          <tbody>
            {users.map(({ id, name, email, teamName, organisationName, lastLoginAt, createdAt }) => {
              return (
                <tr onClick={() => history.push(`/user/${id}`)}>
                  <td>{name}</td>
                  <td>{email}</td>
                  <td>{organisationName}</td>
                  <td>{teamName}</td>
                  <td>{(createdAt || "").slice(0, 10)}</td>
                  <td>{(lastLoginAt || "").slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

const Create = ({ onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 10, textAlign: "right" }}>
      <Button color="primary" size="sm" onClick={() => setOpen(true)}>
        Créer un utilisateur
      </Button>
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer un utilisateur</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: "", email: "", password: "" }}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await api.post("/admin/user", values);
                toastr.success("Created!");
                onChange();
                setOpen(false);
              } catch (e) {
                console.log(e);
                toastr.error("Some Error!", e.code);
              }
              setSubmitting(false);
            }}
          >
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <div>Nom</div>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <div>Email</div>
                      <Input name="email" value={values.email} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <div>Password</div>
                      <Input name="password" value={values.password} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <OrganisationTeamPicker value={values} onChange={handleChange} names={["organisation", "team"]} />
                <br />
                <LoadingButton loading={isSubmitting} color="info" onClick={handleSubmit}>
                  Save
                </LoadingButton>
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </div>
  );
};
