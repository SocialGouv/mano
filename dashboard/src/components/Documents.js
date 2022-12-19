import React, { useMemo, useState } from 'react';
import Table from './table';
import UserName from './UserName';
import { download } from '../utils';
import ButtonCustom from './ButtonCustom';
import { formatDateWithFullMonth } from '../services/date';
import { capture } from '../services/sentry';
import { toast } from 'react-toastify';
import useApi from '../services/api';
import { useRecoilValue } from 'recoil';
import { organisationState, userState } from '../recoil/auth';

const Documents = ({
  personId,
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
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times

  const withDocForGroup = useMemo(
    () => !!organisation.groupsEnabled && documents?.filter((doc) => doc.group).length > 0,
    [documents, organisation.groupsEnabled]
  );

  return (
    <>
      <div className="tw-mt-8 tw-mb-1.5 tw-flex tw-items-center tw-justify-between">
        {!!title && <div className="tw-m-0 tw-flex-1">{title}</div>}
        {!!onAdd && (
          <div className="tw-flex">
            <label className="button-submit">
              Ajouter un document
              <input
                key={resetFileInputKey}
                type="file"
                name="file"
                hidden
                onChange={async (e) => {
                  const docResponse = await API.upload({
                    path: `/person/${personId}/document`,
                    file: e.target.files[0],
                  });
                  if (!docResponse.ok || !docResponse.data) {
                    capture('Error uploading document', { extra: { docResponse } });
                    toast.error("Une erreur est survenue lors de l'envoi du document");
                    return;
                  }
                  onAdd(docResponse);
                  setResetFileInputKey((k) => k + 1);
                }}
              />
            </label>
          </div>
        )}
      </div>
      {children}
      <Table
        data={documents}
        noData="Pas de document"
        rowKey={'_id'}
        onRowClick={onRowClick}
        columns={[
          {
            title: '',
            dataKey: 'group',
            small: true,
            render: (document) => {
              return (
                <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                  {!!document.group && (
                    <span className="tw-text-3xl" aria-label="Action familiale" title="Action familiale">
                      👪
                    </span>
                  )}
                </div>
              );
            },
          },
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
                      try {
                        const file = await API.download({
                          path: document.downloadPath ?? `/person/${personId}/document/${document.file.filename}`,
                          encryptedEntityKey: document.encryptedEntityKey,
                        });
                        download(file, document.name);
                      } catch (error) {
                        capture('Error downloading document', { extra: { error, document }, user });
                        if (error.message === 'wrong secret key for the given ciphertext') {
                          toast.error(
                            'Le fichier est malheureusement corrompu',
                            "Il ne peut plus être téléchargé, mais vous pouvez le supprimer et le réuploader s'il vous le faut"
                          );
                        } else {
                          toast.error('Une erreur est survenue lors du téléchargement du document', "L'équipe technique a été prévenue");
                        }
                      }
                    }}
                  />
                  {!!canDelete && (
                    <ButtonCustom
                      color="danger"
                      title="Supprimer"
                      style={{ margin: '0.5rem auto 0' }}
                      onClick={async () => {
                        if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
                        await API.delete({ path: document.downloadPath ?? `/person/${personId}/document/${document.file.filename}` });
                        onDelete(document);
                      }}
                    />
                  )}
                </>
              );
            },
          },
        ]
          .filter((col) => col.dataKey !== 'group' || !!withDocForGroup)
          .filter((col) => col.dataKey !== 'action' || !!onAdd || !!onDelete)}
      />
    </>
  );
};

export default Documents;
