import { Actions } from './Actions';
import InfosSociales from './InfosSociales';
import { InfosMain } from './InfosMain';
import PersonDocuments from './PersonDocuments';
import InfosMedicales from './InfosMedicales';
import Comments from './Comments';

import PassagesRencontres from './PassagesRencontres';
import OutOfActiveList from '../OutOfActiveList';
import { DeletePersonButton } from '../view';
import { useRecoilValue } from 'recoil';
import { userState } from '../../../recoil/auth';
import MergeTwoPersons from '../MergeTwoPersons';

export default function Summary({ person }) {
  const user = useRecoilValue(userState);
  return (
    <>
      <div className="tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
        <div className="tw-col-span-3">
          <InfosMain person={person} />
        </div>
        <div className="tw-relative tw-col-span-6 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          <Actions person={person} />
        </div>
        <div className="tw-col-span-3 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          {['restricted-access'].includes(user.role) ? <PassagesRencontres person={person} /> : <Comments person={person} />}
        </div>
      </div>
      {!['restricted-access'].includes(user.role) && (
        <>
          <div className="tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
            <div className="pt-4 p-3 border tw-col-span-9 tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
              <InfosSociales person={person} />
            </div>
            <div className="tw-col-span-3 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
              <PassagesRencontres person={person} />
            </div>
          </div>
          <div className="tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
            <div className="pt-4 p-3 border tw-col-span-9 tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
              <InfosMedicales person={person} />
            </div>
            <div className="tw-col-span-3 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
              <PersonDocuments person={person} />
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
