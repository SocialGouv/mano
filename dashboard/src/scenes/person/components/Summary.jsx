import { useRecoilValue } from 'recoil';
import { userState, organisationState } from '../../../recoil/auth';
import { Actions } from './ActionsPerson';
import { InfosMain } from './InfosMain';
import PersonDocuments from './PersonDocuments';
import PersonCustomFields from './PersonCustomFields';
import Comments from './Comments';
import DeletePersonButton from './DeletePersonButton';
import PassagesRencontres from './PassagesRencontres';
import OutOfActiveList from '../OutOfActiveList';
import MergeTwoPersons from '../MergeTwoPersons';
import { customFieldsPersonsSelector } from '../../../recoil/persons';
import { SummaryPrint } from './SummaryPrint';

export default function Summary({ person }) {
  const user = useRecoilValue(userState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const organisation = useRecoilValue(organisationState);

  return (
    <>
      {!import.meta.env.VITE_TEST_PLAYWRIGHT && <SummaryPrint person={person} />}
      <div className="noprint tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
        <div className="tw-col-span-3">
          <InfosMain person={person} />
        </div>
        <div className="tw-col-span-5 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          <Actions person={person} />
        </div>

        <div className="tw-col-span-4 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          {['restricted-access'].includes(user.role) ? <PassagesRencontres person={person} /> : <Comments person={person} />}
        </div>
      </div>
      {!['restricted-access'].includes(user.role) && (
        <>
          <div className="noprint tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
            <div className="tw-col-span-8 tw-flex tw-flex-col tw-gap-4">
              {customFieldsPersons.map(({ name, fields }) => {
                return <PersonCustomFields key={name} person={person} sectionName={name} fields={fields} />;
              })}
            </div>

            <div className="tw-col-span-4 tw-flex tw-h-screen tw-flex-col tw-gap-4 tw-self-stretch tw-overflow-auto">
              {(organisation.rencontresEnabled === true || organisation.passagesEnabled === true) && (
                <div className="tw-basis-1/2 tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                  <PassagesRencontres person={person} />
                </div>
              )}
              <div className="tw-basis-1/2 tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                <PersonDocuments person={person} />
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
