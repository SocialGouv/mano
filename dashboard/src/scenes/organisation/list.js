import React, { useEffect, useState } from "react";
import { Container, Table, Modal, ModalHeader, ModalBody, Button, Row, Col, FormGroup, Input } from "reactstrap";
import { useHistory } from "react-router-dom";
import { Formik } from "formik";
import { toastr } from "react-redux-toastr";

import LoadingButton from "../../components/loadingButton";
import api from "../../services/api";

import Header from "../../components/header";

export default () => {
  const [organisations, setOrganisation] = useState(null);
  const history = useHistory();
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/organisation");
      setOrganisation(data);
    })();
  }, [refresh]);

  if (!organisations) return <div>loading...</div>;

  return (
    <div>
      <Header title="Organisations" />
      <Container style={{ padding: "40px 0" }}>
        <Create onChange={() => setRefresh(true)} />
        <Table hover>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Crée le</th>
            </tr>
          </thead>
          <tbody>
            {organisations.map(({ _id, name, createdAt }) => {
              return (
                <tr onClick={() => history.push(`/organisation/${_id}`)}>
                  <td>{name}</td>
                  <td>{(createdAt || "").slice(0, 10)}</td>
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
        Créer une organisation
      </Button>
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer une organisation</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: "" }}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await api.post("/organisation", values);
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
                      <div>Name</div>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
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
