import { useRecoilState, useRecoilValue } from 'recoil';
import { organisationState, userState } from '../../../recoil/auth';
import { Consultations } from './Consultations';
import { InfosMain } from './InfosMain';
import PersonCustomFields from './PersonCustomFields';
import DeletePersonButton from './DeletePersonButton';
import OutOfActiveList from '../OutOfActiveList';
import MergeTwoPersons from '../MergeTwoPersons';
import { flattenedCustomFieldsPersonsSelector } from '../../../recoil/persons';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { Treatments } from './Treatments';
import { useEffect, useMemo } from 'react';
import PersonDocumentsMedical from './PersonDocumentsMedical';
import { MedicalFilePrint } from './MedicalFilePrint';
import API from '../../../services/api';
import CommentsMedical from './CommentsMedical';

export default function MedicalFile({ person }) {
  const user = useRecoilValue(userState);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const organisation = useRecoilValue(organisationState);
  // These custom fields are displayed by default, because they where displayed before they became custom fields
  const customFieldsMedicalFileWithLegacyFields = useMemo(() => {
    const c = [...customFieldsMedicalFile];
    if (flattenedCustomFieldsPersons.find((e) => e.name === 'structureMedical'))
      c.unshift({ name: 'structureMedical', label: 'Structure de suivi médical', type: 'text', enabled: true });
    if (flattenedCustomFieldsPersons.find((e) => e.name === 'healthInsurances'))
      c.unshift({ name: 'healthInsurances', label: 'Couverture(s) médicale(s)', type: 'multi-choice', enabled: true });
    return c;
  }, [customFieldsMedicalFile, flattenedCustomFieldsPersons]);

  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);
  const medicalFile = useMemo(() => (allMedicalFiles || []).find((m) => m.person === person._id), [allMedicalFiles, person._id]);

  useEffect(() => {
    if (!medicalFile) {
      (async () => {
        const response = await API.post({
          path: '/medical-file',
          body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ person: person._id, documents: [], organisation: organisation._id }),
        });
        if (!response.ok) return;
        setAllMedicalFiles((medicalFiles) => [...medicalFiles, response.decryptedData]);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalFile]);
  return (
    <>
      {!process.env.REACT_APP_TEST_PLAYWRIGHT && <MedicalFilePrint person={person} />}
      <div className="noprint tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
        <div className="tw-col-span-3">
          <InfosMain person={person} isMedicalFile />
        </div>
        <div className="tw-col-span-5 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          <Consultations person={person} />
        </div>
        <div className="tw-col-span-4 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          {['restricted-access'].includes(user.role) ? <PersonDocumentsMedical person={person} /> : <CommentsMedical person={person} />}
        </div>
      </div>
      {!['restricted-access'].includes(user.role) && (
        <>
          <div className="noprint tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
            <div className="tw-col-span-6 tw-flex tw-min-h-[200px] tw-flex-col tw-gap-4">
              <PersonCustomFields
                isMedicalFile
                key={'Dossier Médical'}
                person={person}
                sectionName={'Dossier Médical'}
                fields={customFieldsMedicalFileWithLegacyFields}
                colspan={6}
              />
            </div>
            <div className="tw-col-span-6 tw-flex tw-min-h-full tw-flex-col tw-gap-4">
              <div className="tw-min-h-[200px] tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                <Treatments person={person} />
              </div>
              <div className="tw-min-h-[200px] tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                <PersonDocumentsMedical person={person} />
              </div>
            </div>
          </div>
          <div className="noprint tw-mt-4 tw-flex tw-justify-end tw-gap-2">
            <MergeTwoPersons person={person} />
            <OutOfActiveList person={person} />
            <DeletePersonButton person={person} />
          </div>
        </>
      )}
    </>
  );
}