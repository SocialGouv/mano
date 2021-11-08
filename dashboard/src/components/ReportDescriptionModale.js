import React, { useState } from 'react';
import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { toastr } from 'react-redux-toastr';

import ButtonCustom from './ButtonCustom';
import { Formik } from 'formik';
import { useReports } from '../recoil/reports';

const ReportDescriptionModale = ({ report }) => {
  const { updateReport } = useReports();

  const [open, setOpen] = useState(false);

  return (
    <>
      <ButtonCustom
        onClick={() => setOpen(true)}
        title={!report?.description?.length ? 'Ajouter une description' : '&#9998;'}
        color={!report?.description?.length ? 'info' : 'link'}
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Description</ModalHeader>
        <ModalBody>
          <Formik
            className="noprint"
            initialValues={report}
            onSubmit={async (body) => {
              const reportUpdate = {
                ...report,
                ...body,
              };
              const res = await updateReport(reportUpdate);
              if (res.ok) {
                toastr.success('Mis à jour !');
                setOpen(false);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label>Description</Label>
                    <Input name="description" type="textarea" value={values.description} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ButtonCustom title={'Enregistrer'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </Col>
              </Row>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

export default ReportDescriptionModale;
