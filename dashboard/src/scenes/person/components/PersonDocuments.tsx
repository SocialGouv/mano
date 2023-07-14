import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import type { RecoilValueReadOnly } from 'recoil';
import { organisationAuthentifiedState } from '../../../recoil/auth';
import { personsState, usePreparePersonForEncryption } from '../../../recoil/persons';
import API from '../../../services/api';
import { capture } from '../../../services/sentry';
import { DocumentsModule } from '../../../components/DocumentsGeneric';
import { groupsState } from '../../../recoil/groups';
import type { PersonPopulated, PersonInstance } from '../../../types/person';
import type { DocumentWithLinkedItem, Document } from '../../../types/document';
import type { UUIDV4 } from '../../../types/uuid';
import { personsObjectSelector } from '../../../recoil/selectors';

interface PersonDocumentsProps {
  person: PersonPopulated;
}

type PersonIndex = Record<UUIDV4, PersonInstance>;

const PersonDocuments = ({ person }: PersonDocumentsProps) => {
  const setPersons = useSetRecoilState(personsState);
  const organisation = useRecoilValue(organisationAuthentifiedState);
  const groups = useRecoilValue(groupsState);
  const preparePersonForEncryption = usePreparePersonForEncryption();
  const persons = useRecoilValue<PersonIndex>(personsObjectSelector as RecoilValueReadOnly<PersonIndex>);

  const documents = [...(person.documentsForModule || []), ...(person.groupDocuments || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const canToggleGroupCheck = useMemo(() => {
    if (!organisation.groupsEnabled) return false;
    const group = groups.find((group) => group.persons.includes(person._id));
    if (!group) return false;
    return true;
  }, [groups, person._id, organisation.groupsEnabled]);

  return (
    <DocumentsModule
      showPanel
      onSaveNewOrder={async (nextDocuments) => {
        const personResponse = await API.put({
          path: `/person/${person._id}`,
          body: preparePersonForEncryption({
            ...person,
            documents: [
              ...nextDocuments,
              ...(person.documents || []).filter((docOrFolder) => {
                const document = docOrFolder as unknown as Document;
                return !!document.group;
              }),
            ],
          }),
        });
        if (!personResponse.ok) {
          toast.error("Erreur lors de l'enregistrement des documents, vous pouvez contactez le support");
          return false;
        }
        const newPerson = personResponse.decryptedData;
        setPersons((persons) =>
          persons.map((p) => {
            if (p._id === person._id) return newPerson;
            return p;
          })
        );
        return true;
      }}
      documents={documents}
      personId={person._id}
      title={`Documents de ${person.name}`}
      canToggleGroupCheck={canToggleGroupCheck}
      onDeleteDocument={async (documentOrFolder) => {
        // the document can be a group document, or a person document, or a folder
        // so we need to get the person to update
        const _person = persons[documentOrFolder.linkedItem._id];
        if (documentOrFolder.type === 'document') {
          const document = documentOrFolder as DocumentWithLinkedItem;
          await API.delete({ path: document.downloadPath ?? `/person/${_person._id}/document/${document.file.filename}` });
        }
        const personResponse = await API.put({
          path: `/person/${_person._id}`,
          body: preparePersonForEncryption({
            ..._person,
            documents: _person.documents?.filter((d) => d._id !== documentOrFolder._id),
          }),
        });
        if (personResponse.ok) {
          const newPerson = personResponse.decryptedData;
          setPersons((persons) =>
            persons.map((p) => {
              if (p._id === _person._id) return newPerson;
              return p;
            })
          );
          toast.success(documentOrFolder.type === 'document' ? 'Document supprimé' : 'Dossier supprimé');
          return true;
        } else {
          toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
          return false;
        }
      }}
      onSubmitDocument={async (documentOrFolder) => {
        // the document can be a group document, or a person document, or a folder
        // so we need to get the person to update
        const _person = persons[documentOrFolder.linkedItem._id];
        const personResponse = await API.put({
          path: `/person/${_person._id}`,
          body: preparePersonForEncryption({
            ..._person,
            documents: _person.documents?.map((d) => {
              if (d._id === documentOrFolder._id) return documentOrFolder;
              return d;
            }),
          }),
        });
        if (personResponse.ok) {
          const newPerson = personResponse.decryptedData;
          setPersons((persons) =>
            persons.map((p) => {
              if (p._id === _person._id) return newPerson;
              return p;
            })
          );
          toast.success(documentOrFolder.type === 'document' ? 'Document mis à jour' : 'Dossier mis à jour');
        } else {
          toast.error('Erreur lors de la mise à jour du document, vous pouvez contactez le support');
          capture('Error while updating treatment document', { _person, document });
        }
      }}
      onAddDocuments={async (documents) => {
        const personResponse = await API.put({
          path: `/person/${person._id}`,
          body: preparePersonForEncryption({
            ...person,
            documents: [...(person.documents || []), ...documents],
          }),
        });
        if (personResponse.ok) {
          toast.success('Documents enregistrés !');
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
  );
};

export default PersonDocuments;
