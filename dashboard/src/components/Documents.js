/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { Row, Col } from 'reactstrap';
import { theme } from '../config';
import { Field, Formik } from 'formik';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import Table from './table';
import UserName from './UserName';
import { toFrenchDate, download } from '../utils';
import { usePersons } from '../recoil/persons';
import { userState } from '../recoil/auth';
import ButtonCustom from './ButtonCustom';

const Documents = ({ person, onUpdateResults }) => {
  const { updatePerson, uploadDocument, downloadDocument, deleteDocument } = usePersons();
  const user = useRecoilValue(userState);

  useEffect(() => {
    if (!!onUpdateResults) onUpdateResults(person.documents?.length || 0);
  }, [person.documents?.length]);

  return (
    <>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col>
          <Title>Documents</Title>
        </Col>
      </Row>

      <Formik initialValues={{ place: null }} onSubmit={async () => {}}>
        {() => (
          <div style={{ marginLeft: 'auto' }}>
            <FileWrapper>
              Ajouter un document
              <Field
                type="file"
                name="file"
                hidden
                onChange={async (e) => {
                  const { data: file, encryptedEntityKey } = await uploadDocument(e.target.files[0], person);
                  await updatePerson({
                    ...person,
                    documents: [
                      ...(person.documents || []),
                      {
                        _id: file.filename,
                        name: file.originalname,
                        encryptedEntityKey,
                        createdAt: new Date(),
                        createdBy: user._id,
                        file,
                      },
                    ],
                  });
                }}
              />
            </FileWrapper>
          </div>
        )}
      </Formik>
      <Table
        data={person.documents}
        rowKey={'_id'}
        onRowClick={() => {}}
        columns={[
          { title: 'Nom', dataKey: 'name', render: (document) => <b>{document.name}</b> },
          { title: 'Ajouté le', dataKey: 'createdAt', render: (document) => toFrenchDate(document.createdAt) },
          { title: 'Ajouté par', dataKey: 'createdBy', render: (document) => <UserName id={document.createdBy} /> },
          {
            title: 'Action',
            dataKey: 'action',
            render: (document) => {
              return (
                <>
                  <ButtonCustom
                    color="primary"
                    title="Télécharger"
                    style={{ margin: '0 auto 0.5rem' }}
                    onClick={async () => {
                      const doc = await downloadDocument(person, document);
                      download(doc, document.name);
                    }}
                  />
                  <ButtonCustom
                    color="danger"
                    title="Supprimer"
                    style={{ margin: 'auto' }}
                    onClick={async () => {
                      if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
                      await deleteDocument(person, document);
                      await updatePerson({
                        ...person,
                        documents: person.documents.filter((d) => d._id !== document._id),
                      });
                      onUpdateResults(person.documents.length);
                    }}
                  />
                </>
              );
            },
          },
        ]}
      />
    </>
  );
};

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
`;

const FileWrapper = styled.label`
  ${(p) => `background: ${theme.main}; color: ${theme.white};`};
  border-radius: 8px;
  font-size: 14px;
  box-shadow: none;
  border: none;
  cursor: pointer;
  padding: 8px 15px;
`;

export default Documents;
