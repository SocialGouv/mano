import React, { useMemo, useState } from 'react';
import Table from './table';
import UserName from './UserName';
import { download } from '../utils';
import { formatDateWithFullMonth } from '../services/date';
import { capture } from '../services/sentry';
import { toast } from 'react-toastify';
import API from '../services/api';
import { useRecoilValue } from 'recoil';
import { organisationState, userState } from '../recoil/auth';
import { DocumentIcon } from '../scenes/person/components/DocumentIcon';

const Documents = ({
  personId,
  documents,
  onAdd,
  onDelete,
  children,
  additionalColumns = [],
  conditionForDelete = () => true,
  onRowClick = null,
  color = 'main', // main/blue-900
}) => {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times

  const withDocForGroup = useMemo(
    () => !!organisation.groupsEnabled && documents?.filter((doc) => doc.group).length > 0,
    [documents, organisation.groupsEnabled]
  );

  return (
    <>
      {!documents?.length && (
        <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
          <DocumentIcon />
          Aucun document pour le moment
        </div>
      )}
      <div className="tw-my-2 tw-flex tw-items-center tw-justify-between">
        {!!onAdd && (
          <div className="tw-mx-auto tw-flex">
            <label className={`button-submit !tw-bg-${color}`}>
              ＋ Ajouter des documents
              <input
                key={resetFileInputKey}
                type="file"
                name="file"
                multiple
                hidden
                onChange={async (e) => {
                  let nextDocuments = [...(documents || [])];
                  if (!e.target.files?.length) return;
                  for (let i = 0; i < e.target.files.length; i++) {
                    const fileToUpload = e.target.files[i];
                    const docResponse = await API.upload({
                      path: `/person/${personId}/document`,
                      file: fileToUpload,
                    });
                    if (!docResponse.ok || !docResponse.data) {
                      capture('Error uploading document', { extra: { docResponse } });
                      toast.error(`Une erreur est survenue lors de l'envoi du document ${fileToUpload?.filename}`);
                      return;
                    }
                    const { data: file, encryptedEntityKey } = docResponse;
                    nextDocuments.push({
                      _id: file.filename,
                      name: file.originalname,
                      encryptedEntityKey,
                      createdAt: new Date(),
                      createdBy: user._id,
                      downloadPath: `/person/${personId}/document/${file.filename}`,
                      file,
                    });
                  }
                  onAdd(nextDocuments);
                  setResetFileInputKey((k) => k + 1);
                }}
              />
            </label>
          </div>
        )}
      </div>
      {children}
      {documents?.length > 0 && (
        <Table
          data={documents}
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
                  <div className="tw-flex tw-flex-col tw-gap-1">
                    <button
                      type="button"
                      title="Télécharger"
                      className={`tw-underline tw-text-${color} tw-underline-${color}`}
                      // className={`button-submit !tw-bg-${color}`}
                      onClick={async (e) => {
                        e.stopPropagation();
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
                      }}>
                      Télécharger
                    </button>
                    {!!canDelete && (
                      <button
                        type="button"
                        className="tw-underline-red-500 tw-text-red-500 tw-underline"
                        onClick={async () => {
                          if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
                          await API.delete({ path: document.downloadPath ?? `/person/${personId}/document/${document.file.filename}` });
                          onDelete(document);
                        }}>
                        Supprimer
                      </button>
                    )}
                  </div>
                );
              },
            },
          ]
            .filter((col) => col.dataKey !== 'group' || !!withDocForGroup)
            .filter((col) => col.dataKey !== 'action' || !!onAdd || !!onDelete)}
        />
      )}
    </>
  );
};

export default Documents;
