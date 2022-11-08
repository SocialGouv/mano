import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import ButtonCustom from '../../../components/ButtonCustom';
import TagTeam from '../../../components/TagTeam';
import { usersState } from '../../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import CommentModal from './CommentModal';

export default function Comments({ comments }) {
  const users = useRecoilValue(usersState);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  return (
    <Container>
      {modalCreateOpen && <CommentModal isNewComment={true} onClose={() => setModalCreateOpen(false)} />}
      {modalEditOpen && <CommentModal comment={commentToEdit} isNewComment={false} onClose={() => setModalEditOpen(false)} />}
      <div className="flex">
        <h4 className="mt-2 mb-4 flex-1">Commentaires</h4>
        <ButtonCustom onClick={() => setModalCreateOpen(true)} title="Ajouter" />
      </div>

      <table className="table table-striped">
        <tbody className="small">
          {(comments || []).map((comment) => {
            return (
              <tr>
                <td
                  onClick={() => {
                    setModalEditOpen(true);
                    setCommentToEdit(comment);
                  }}>
                  <div>{formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}</div>
                  <div className="content">
                    {(comment.comment || '').split('\n').map((e) => (
                      <p>{e}</p>
                    ))}
                  </div>
                  <div className="small">Créé par {users.find((e) => e._id === comment.user)?.name}</div>
                  <TagTeam teamId={comment.team} />
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
