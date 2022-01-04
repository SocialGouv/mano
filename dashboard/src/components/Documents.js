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

const Documents = ({ person, onUpdateResults }) => {
  const { updatePerson, uploadDocument } = usePersons();
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
                  console.log(e.target.files[0]);
                  // Send form data
                  await uploadDocument(e.target.files[0], person);

                  await updatePerson({
                    ...person,
                    documents: [
                      ...(person.documents || []),
                      {
                        name: e.target.files[0].name,
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
          { title: 'Nom', render: (document) => document.name },
          { title: 'Ajouté le', dataKey: 'createdAt', render: (document) => toFrenchDate(document.createdAt) },
          { title: 'Ajouté par', dataKey: 'createdBy', render: (document) => <UserName id={document.createdBy} /> },
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
