import { Col, Row } from 'reactstrap';
import { Actions } from './Actions';
import { theme } from '../../../config';

import { formatBirthDate, dayjsInstance } from '../../../services/date';
import InfosSociales from './InfosSociales';
import { InfosMain } from './InfosMain';
import PersonDocuments from './PersonDocuments';
import InfosMedicales from './InfosMedicales';
import Comments from './Comments';
import styled from 'styled-components';

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
      <ContainerRow>
        <div className="span-3 col-main">
          <InfosMain person={person} />
        </div>
        <div className="span-6 border shadow rounded col-alt tw-relative">
          <Actions person={person} />
        </div>
        <div className="span-3 col-alt border shadow rounded">
          <Comments comments={person.comments} person={person} />
        </div>
      </ContainerRow>
      <ContainerRow>
        <div className="span-9 col-main pt-4 border shadow rounded p-3">
          <InfosSociales person={person} />
        </div>
        <div className="span-3 col-alt border shadow rounded p-3">
          <PassagesRencontres person={person} />
        </div>
      </ContainerRow>
      <ContainerRow>
        <div className="span-9 col-main pt-4 border shadow rounded p-3">
          <InfosMedicales person={person} />
        </div>
        <div className="span-3 col-alt border shadow rounded p-3">
          <PersonDocuments person={person} onUpdateResults={() => {}} onGoToMedicalFiles={() => {}} />
        </div>
      </ContainerRow>
      {!['restricted-access'].includes(user.role) && (
        <div className="tw-mt-4 tw-flex tw-justify-end tw-gap-2">
          <MergeTwoPersons person={person} />
          <OutOfActiveList person={person} />
          <DeletePersonButton person={person} />
        </div>
      )}
    </>
  );
}

const ContainerRow = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0px, 1fr));
  grid-gap: 1rem;
  padding: 1rem 0 0 0;
  box-sizing: border-box;

  .span-3 {
    grid-column: span 3 / span 3;
  }

  .span-6 {
    grid-column: span 6 / span 6;
  }
  .span-9 {
    grid-column: span 9 / span 9;
  }
  & > div {
    box-sizing: border-box;
  }
  .col-alt {
    overflow-x: auto;
    overflow-y: auto;
    height: 0;
    min-height: 100%;
  }
`;
