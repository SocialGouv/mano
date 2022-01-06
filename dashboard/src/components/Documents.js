/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Row, Col } from 'reactstrap';
import { theme } from '../config';
import { Field, Formik } from 'formik';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import Table from './table';
import UserName from './UserName';
import { toFrenchDate } from '../utils';
import { usePersons } from '../recoil/persons';
import { userState } from '../recoil/auth';
import ButtonCustom from './ButtonCustom';

function download(file, fileName) {
  if (window.navigator.msSaveOrOpenBlob) {
    //IE11 & Edge
    window.navigator.msSaveOrOpenBlob(file, fileName);
  } else {
    //Other browsers
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }
}

const Documents = ({ person, onUpdateResults }) => {
  const { updatePerson, uploadDocument, downloadDocument } = usePersons();
  const user = useRecoilValue(userState);

  return (
    <>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col>
          <Title>Documents</Title>
        </Col>
      </Row>

      <Formik initialValues={{ place: null }} onSubmit={async () => {}}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <>
            <FileWrapper>
              Ajouter un document
              <Field
                type="file"
                name="file"
                hidden
                onChange={async (e) => {
                  const { data: file } = await uploadDocument(e.target.files[0], person);
                  console.log('fillll', file);
                  await updatePerson({
                    ...person,
                    documents: [
                      ...(person.documents || []),
                      {
                        name: e.target.files[0].name,
                        file,
                        createdAt: new Date(),
                        createdBy: user._id,
                      },
                    ],
                  });
                  onUpdateResults((person.documents || []).length);
                }}
              />
            </FileWrapper>
          </>
        )}
      </Formik>
      <Table
        data={person.documents}
        rowKey={'_id'}
        onRowClick={() => {}}
        columns={[
          { title: 'Nom', dataKey: 'name', render: (document) => document.name },
          { title: 'Ajouté le', dataKey: 'createdAt', render: (document) => toFrenchDate(document.createdAt) },
          { title: 'Ajouté par', dataKey: 'createdBy', render: (document) => <UserName id={document.createdBy} /> },
          {
            title: 'Action',
            dataKey: 'action',
            render: (document) => {
              return (
                <>
                  <ButtonCustom
                    color="danger"
                    title="Supprimer"
                    style={{ margin: '0 auto 0.5rem' }}
                    onClick={async () => {
                      await updatePerson({
                        ...person,
                        documents: (person.documents || []).filter((d) => d._id !== document._id),
                      });
                      onUpdateResults((person.documents || []).length);
                    }}
                  />
                  <ButtonCustom
                    color="primary"
                    title="Télécharger"
                    style={{ margin: 'auto' }}
                    onClick={async () => {
                      console.log(document);
                      const doc = await downloadDocument(person, document.file.filename);
                      console.log(doc);
                      download(doc, document.name);
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
  max-width: 450px;
  display: grid;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  border: none;
  position: relative;
  cursor: pointer;
  padding: 8px 15px;
`;

export default Documents;
