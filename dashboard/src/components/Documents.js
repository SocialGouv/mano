import React, { useState } from 'react';
import { theme } from '../config';
import { Field, Formik } from 'formik';
import styled from 'styled-components';
import Table from './table';
import UserName from './UserName';
import { download } from '../utils';
import ButtonCustom from './ButtonCustom';
import { formatDateWithFullMonth } from '../services/date';
import { capture } from '../services/sentry';
import { toastr } from 'react-redux-toastr';
import useApi from '../services/api';
import { Col, Row } from 'reactstrap';

const Documents = ({
  person,
  documents,
  onAdd,
  onDelete,
  title,
  children,
  additionalColumns = [],
  conditionForDelete = () => true,
  onRowClick = null,
}) => {
  const API = useApi();
  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times

  return (
    <>
      <Formik initialValues={{ place: null }} onSubmit={async () => {}}>
        {() => (
          <Row style={{ marginTop: '30px', marginBottom: '5px', alignItems: 'center', justifyContent: 'space-between' }}>
            {!!title && <Col md={6}>{title}</Col>}
            <Col md={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FileWrapper>
                Ajouter un document
                <Field
                  key={resetFileInputKey}
                  type="file"
                  name="file"
                  hidden
                  onChange={async (e) => {
                    const docResponse = await API.upload({
                      path: `/person/${person._id}/document`,
                      file: e.target.files[0],
                    });
                    if (!docResponse.ok || !docResponse.data) {
                      capture('Error uploading document', { extra: { docResponse } });
                      toastr.error('Erreur', "Une erreur est survenue lors de l'envoi du document");
                      return;
                    }
                    onAdd(docResponse);
                    setResetFileInputKey((k) => k + 1);
                  }}
                />
              </FileWrapper>
            </Col>
          </Row>
        )}
      </Formik>
      {children}
      <Table
        data={documents}
        noData="Pas de document"
        rowKey={'_id'}
        onRowClick={onRowClick}
        columns={[
          { title: 'Nom', dataKey: 'name', render: (document) => <b>{document.name}</b> },
          { title: 'Ajouté le', dataKey: 'createdAt', render: (document) => formatDateWithFullMonth(document.createdAt) },
          { title: 'Ajouté par', dataKey: 'createdBy', render: (document) => <UserName id={document.createdBy} /> },
          ...additionalColumns,
          {
            title: 'Action',
            dataKey: 'action',
            render: (document) => {
              const canDelete = conditionForDelete(document);
              return (
                <>
                  <ButtonCustom
                    color="primary"
                    title="Télécharger"
                    style={{ margin: '0 auto' }}
                    onClick={async () => {
                      const file = await API.download({
                        path: `/person/${person._id}/document/${document.file.filename}`,
                        encryptedEntityKey: document.encryptedEntityKey,
                      });
                      download(file, document.name);
                    }}
                  />
                  {!!canDelete && (
                    <ButtonCustom
                      color="danger"
                      title="Supprimer"
                      style={{ margin: '0.5rem auto 0' }}
                      onClick={async () => {
                        if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
                        await API.delete({ path: `/person/${person._id}/document/${document.file.filename}` });
                        onDelete(document);
                      }}
                    />
                  )}
                </>
              );
            },
          },
        ]}
      />
    </>
  );
};

const FileWrapper = styled.label`
  background: ${theme.main};
  color: ${theme.white};
  border-radius: 8px;
  font-size: 14px;
  box-shadow: none;
  border: none;
  cursor: pointer;
  padding: 8px 15px;
  margin: 0;
`;

export default Documents;
