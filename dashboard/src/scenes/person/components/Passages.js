import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import TagTeam from '../../../components/TagTeam';
import { usersState } from '../../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../../services/date';

export default function Passages({ passages }) {
  const users = useRecoilValue(usersState);
  return (
    <Container>
      <h4 className="mt-2 mb-4">passageaires</h4>
      <table className="table table-striped">
        <tbody className="small">
          {(passages || []).map((passage) => {
            return (
              <tr>
                <td>
                  <div>{formatDateTimeWithNameOfDay(passage.date || passage.createdAt)}</div>
                  <div className="content">
                    {(passage.comment || '').split('\n').map((e) => (
                      <p>{e}</p>
                    ))}
                  </div>
                  <div className="small">Créé par {users.find((e) => e._id === passage.user)?.name}</div>
                  <TagTeam teamId={passage.team} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Container>
  );
}

const Container = styled.div`
  .content {
    overflow-wrap: anywhere;
  }
`;
