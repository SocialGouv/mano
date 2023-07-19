import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { organisationAuthentifiedState } from '../../../recoil/auth';
import { personsState, usePreparePersonForEncryption } from '../../../recoil/persons';
import API from '../../../services/api';
import { capture } from '../../../services/sentry';
import { DocumentsModule } from '../../../components/DocumentsGeneric';
import { groupsState } from '../../../recoil/groups';
import type { PersonPopulated, PersonInstance } from '../../../types/person';

interface PersonDocumentsProps {
  person: PersonPopulated;
}

const PersonDocuments = ({ person }: PersonDocumentsProps) => {
  const setPersons = useSetRecoilState(personsState);
  const organisation = useRecoilValue(organisationAuthentifiedState);
  const groups = useRecoilValue(groupsState);
  const preparePersonForEncryption = usePreparePersonForEncryption();

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
      documents={documents}
      personId={person._id}
      canToggleGroupCheck={canToggleGroupCheck}
      onDeleteDocument={async (document) => {
        // the document can be a group document, or a person document
        // so we need to get the person to update
        const _person = document.linkedItem.item as PersonInstance;
        await API.delete({ path: document.downloadPath ?? `/person/${_person._id}/document/${document.file.filename}` });
        const personResponse = await API.put({
          path: `/person/${_person._id}`,
          body: preparePersonForEncryption({
            ..._person,
            documents: _person.documents?.filter((d) => d._id !== document._id),
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
          toast.success('Document supprimé');
          return true;
        } else {
          toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
          return false;
        }
      }}
      onSubmitDocument={async (document) => {
        // the document can be a group document, or a person document
        // so we need to get the person to update
        const _person = document.linkedItem.item as PersonInstance;
        const personResponse = await API.put({
          path: `/person/${_person._id}`,
          body: preparePersonForEncryption({
            ..._person,
            documents: _person.documents?.map((d) => {
              if (d._id === document._id) return document;
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
          toast.success('Document mis à jour');
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
