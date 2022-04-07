import React, { useEffect } from 'react';
import { Row, Col } from 'reactstrap';
import { theme } from '../config';
import { Field, Formik } from 'formik';
import styled from 'styled-components';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import Table from './table';
import UserName from './UserName';
import { download } from '../utils';
import { customFieldsPersonsMedicalSelector, customFieldsPersonsSocialSelector, personsState, preparePersonForEncryption } from '../recoil/persons';
import { userState } from '../recoil/auth';
import ButtonCustom from './ButtonCustom';
import { formatDateWithFullMonth } from '../services/date';
import { capture } from '../services/sentry';
import { toastr } from 'react-redux-toastr';
import useApi from '../services/api';

const Documents = ({ person, onUpdateResults }) => {
  const user = useRecoilValue(userState);
  const setPersons = useSetRecoilState(personsState);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const API = useApi();

  useEffect(() => {
    if (!!onUpdateResults) onUpdateResults(person.documents?.length || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                  const docResponse = await API.upload({
                    path: `/person/${person._id}/document`,
                    file: e.target.files[0],
                  });
                  if (!docResponse.ok || !docResponse.data) {
                    capture('Error uploading document', { extra: { docResponse } });
                    toastr.error('Erreur', "Une erreur est survenue lors de l'envoi du document");
                    return;
                  }
                  const { data: file, encryptedEntityKey } = docResponse;
                  const personResponse = await API.put({
                    path: `/person/${person._id}`,
                    body: preparePersonForEncryption(
                      customFieldsPersonsMedical,
                      customFieldsPersonsSocial
                    )({
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
                    }),
                  });
                  if (personResponse.ok) {
                    const newPerson = personResponse.decryptedData;
                    setPersons((persons) =>
                      persons.map((p) => {
                        if (p._id === person._id) return newPerson;
                        return p;
                      })
                    );
                  }
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
          { title: 'Ajouté le', dataKey: 'createdAt', render: (document) => formatDateWithFullMonth(document.createdAt) },
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
                      const file = await API.download({
                        path: `/person/${person._id}/document/${document.file.filename}`,
                        encryptedEntityKey: document.encryptedEntityKey,
                      });
                      download(file, document.name);
                    }}
                  />
                  <ButtonCustom
                    color="danger"
                    title="Supprimer"
                    style={{ margin: 'auto' }}
                    onClick={async () => {
                      if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
                      await API.delete({ path: `/person/${person._id}/document/${document.file.filename}` });
                      const personResponse = await API.put({
                        path: `/person/${person._id}`,
                        body: preparePersonForEncryption(
                          customFieldsPersonsMedical,
                          customFieldsPersonsSocial
                        )({
                          ...person,
                          documents: person.documents.filter((d) => d._id !== document._id),
                        }),
                      });
                      if (personResponse.ok) {
                        const newPerson = personResponse.decryptedData;
                        setPersons((persons) =>
                          persons.map((p) => {
                            if (p._id === person._id) return newPerson;
                            return p;
                          })
                        );
                      }
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
