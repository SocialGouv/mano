import { useRecoilValue } from 'recoil';
import { userState } from '../../../recoil/auth';
import { Consultations } from './Consultations';
import { InfosMain } from './InfosMain';
import PersonDocuments from './PersonDocuments';
import PersonCustomFields from './PersonCustomFields';
import Comments from './Comments';
import DeletePersonButton from './DeletePersonButton';
import PassagesRencontres from './PassagesRencontres';
import OutOfActiveList from '../OutOfActiveList';
import MergeTwoPersons from '../MergeTwoPersons';
import { customFieldsPersonsSelector } from '../../../recoil/persons';
import { customFieldsMedicalFileSelector } from '../../../recoil/medicalFiles';
import { Treatments } from './Treatments';
import PersonMedicalDocuments from './PersonMedicalDocuments';

export default function MedicalFile({ person }) {
  const user = useRecoilValue(userState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  return (
    <>
      <div className="tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
        <div className="tw-col-span-3">
          <InfosMain person={person} isMedicalFile />
        </div>
        <div className="tw-col-span-5 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          <Consultations person={person} />
        </div>
        <div className="tw-col-span-4 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          <PersonMedicalDocuments person={person} />
        </div>
      </div>
      {!['restricted-access'].includes(user.role) && (
        <>
          <div className="tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
            <div className="tw-col-span-6 tw-flex tw-min-h-[200px] tw-flex-col tw-gap-4">
              <PersonCustomFields
                key={'Dossier médical'}
                person={person}
                sectionName={'Dossier médical'}
                fields={customFieldsMedicalFile}
                colspan={6}
              />
            </div>
            <div className="tw-col-span-6 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
              <Treatments person={person} />
            </div>
          </div>
          <div className="tw-mt-4 tw-flex tw-justify-end tw-gap-2">
            <MergeTwoPersons person={person} />
            <OutOfActiveList person={person} />
            <DeletePersonButton person={person} />
          </div>
        </>
      )}
    </>
  );
}
