import React, { useRef, useState } from 'react';
import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';

import ButtonCustom from './ButtonCustom';
import { Formik } from 'formik';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import useApi from '../services/api';
import { useRecoilState, useRecoilValue } from 'recoil';
import { lastLoadState, mergeItems } from './DataLoader';

const ReportDescriptionModale = ({ report }) => {
  const [reports, setReports] = useRecoilState(reportsState);
  const API = useApi();
  const [open, setOpen] = useState(false);
  const lastLoad = useRecoilValue(lastLoadState);
  const component = useRef(new Error().stack.split('\n')[2].trim().split(' ')[1]);

  return (
    <>
      <ButtonCustom
        onClick={() => setOpen(true)}
        title={!report?.description?.length ? 'Ajouter une description' : '(cliquez ici pour modifier)'}
        color={!report?.description?.length ? 'info' : 'link'}
        style={{ marginBottom: '0.5rem' }}
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setOpen(false)}>Description</ModalHeader>
        <ModalBody>
          <Formik
            className="noprint"
            initialValues={{ ...report, description: report.description || window.sessionStorage.getItem('currentReportDescription') || '' }}
            onSubmit={async (body) => {
              const latestReportsRes = await API.get({
                path: '/report',
                query: { after: lastLoad, withDeleted: true },
              });
              const allReports = mergeItems(reports, latestReportsRes.decryptedData);
              const reportAtDate = allReports.find((_report) => _report.date === report.date && _report.team === report.team);
              const reportUpdate = {
                ...(reportAtDate || { team: report.team, date: report.date }),
                description: body.description,
              };
              const isNew = !reportAtDate?._id;
              const res = isNew
                ? await API.post({
                    path: '/report',
                    body: prepareReportForEncryption(reportUpdate),
                    headers: {
                      'debug-report-component': 'ReportDescriptionModale',
                      'debug-report-parent-component': component.current,
                      'debug-report-function': new Error().stack.split('\n')[2].trim().split(' ')[1],
                    },
                  })
                : await API.put({ path: `/report/${reportAtDate._id}`, body: prepareReportForEncryption(reportUpdate) });
              if (res.ok) {
                setReports((reports) =>
                  isNew
                    ? [res.decryptedData, ...reports]
                    : reports.map((a) => {
                        if (a._id === reportAtDate._id) return res.decryptedData;
                        return a;
                      })
                );
                setOpen(false);
                window.sessionStorage.removeItem('currentReportDescription');
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      type="textarea"
                      value={values.description}
                      onChange={(e) => {
                        window.sessionStorage.setItem('currentReportDescription', e.target.value);
                        handleChange(e);
                      }}
                    />
                  </FormGroup>
                </Col>
                <Col md={12} style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <ButtonCustom title={'Enregistrer'} loading={isSubmitting} onClick={handleSubmit} />
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
