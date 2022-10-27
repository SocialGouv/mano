import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import { usersState } from '../../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../../services/date';

export default function Comments({ comments }) {
  const users = useRecoilValue(usersState);
  return (
    <Container>
      <h4 className="mt-2 mb-4">Commentaires</h4>
      <table className="table table-striped">
        <tbody className="small">
          {(comments || []).map((comment) => {
            return (
              <tr>
                <td>
                  <div>{formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}</div>
                  <div className="content">
                    {(comment.comment || '').split('\n').map((e) => (
                      <p>{e}</p>
                    ))}
                  </div>
                  <div className="small">Créé par {users.find((e) => e._id === comment.user)?.name}</div>
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
