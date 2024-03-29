import React, { useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilState } from 'recoil';

import Header from '../components/header';
import Loading from '../components/loading';
import ButtonCustom from '../components/ButtonCustom';
import ChangePassword from '../components/ChangePassword';
import { userState } from '../recoil/auth';
import API from '../services/api';

const Account = () => {
  const [user, setUser] = useRecoilState(userState);

  if (!user) return <Loading />;

  return (
    <>
      <Header title={user.name} />
      <Formik
        initialValues={user}
        onSubmit={async (body) => {
          try {
            const response = await API.put({ path: '/user', body });
            if (response.ok) {
              toast.success('Mis à jour !');
              const { user } = await API.get({ path: '/user/me' });
              setUser(user);
            }
          } catch (userUpdateError) {
            console.log('error in user update', userUpdateError);
            toast.error(userUpdateError.message);
          }
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <React.Fragment>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label htmlFor="name">Nom</Label>
                  <Input id="name" name="name" value={values.name} onChange={handleChange} />
                </FormGroup>
              </Col>
              {/* <Col md={6} /> */}
              <Col md={6}>
                <FormGroup>
                  <Label htmlFor="email">Email</Label>
                  <Input disabled id="email" name="email" value={values.email} onChange={handleChange} />
                </FormGroup>
              </Col>
              {/* <Col md={6} /> */}
            </Row>
            <hr />
            <Row style={{ display: 'flex', justifyContent: 'center' }}>
              <LinkToChangePassword />
              <ButtonCustom width="250" title="Mettre à jour" loading={isSubmitting} onClick={handleSubmit} />
            </Row>
          </React.Fragment>
        )}
      </Formik>
    </>
  );
};

const LinkToChangePassword = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ButtonCustom
        width="250"
        title="Modifier son mot de passe"
        type="button"
        style={{ marginRight: 25 }}
        color="secondary"
        onClick={() => setOpen(true)}
      />

      <Modal isOpen={open} toggle={() => setOpen(false)} className="change-password" backdrop="static">
        <ModalHeader>Modifier son mot de passe</ModalHeader>
        <ModalBody>
          <ChangePassword
            onSubmit={(body) => API.post({ path: `/user/reset_password`, body })}
            onFinished={() => setOpen(false)}
            withCurrentPassword
          />
        </ModalBody>
      </Modal>
    </>
  );
};

export default Account;
