import React, { useState } from 'react';
import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { toastr } from 'react-redux-toastr';

import ButtonCustom from './ButtonCustom';
import { Formik } from 'formik';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import useApi from '../services/api';
import { useSetRecoilState } from 'recoil';

const ReportDescriptionModale = ({ report }) => {
  const setReports = useSetRecoilState(reportsState);
  const API = useApi();
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
              const res = await API.put({ path: `/report/${report._id}`, body: prepareReportForEncryption(reportUpdate) });
              if (res.ok) {
                setReports((reports) =>
                  reports.map((a) => {
                    if (a._id === report._id) return res.decryptedData;
                    return a;
                  })
                );
                toastr.success('Mis à jour !');
                setOpen(false);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" type="textarea" value={values.description} onChange={handleChange} />
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
