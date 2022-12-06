import React from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { personsState } from '../../../recoil/persons';
import { actionsState } from '../../../recoil/actions';
import useApi from '../../../services/api';
import { commentsState } from '../../../recoil/comments';
import { passagesState } from '../../../recoil/passages';
import { rencontresState } from '../../../recoil/rencontres';
import DeleteButtonAndConfirmModal from '../../../components/DeleteButtonAndConfirmModal';
import { relsPersonPlaceState } from '../../../recoil/relPersonPlace';
import { medicalFileState } from '../../../recoil/medicalFiles';
import { consultationsState } from '../../../recoil/consultations';
import { treatmentsState } from '../../../recoil/treatments';
import { userState } from '../../../recoil/auth';

const DeletePersonButton = ({ person }) => {
  const API = useApi();
  const setPersons = useSetRecoilState(personsState);

  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [passages, setPassages] = useRecoilState(passagesState);
  const [rencontres, setRencontres] = useRecoilState(rencontresState);
  const [consultations, setConsultations] = useRecoilState(consultationsState);
  const [treatments, setTreatments] = useRecoilState(treatmentsState);
  const [medicalFiles, setMedicalFiles] = useRecoilState(medicalFileState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const user = useRecoilState(userState);
  const history = useHistory();

  return (
    <DeleteButtonAndConfirmModal
      title={`Voulez-vous vraiment supprimer la personne ${person.name}`}
      textToConfirm={person.name}
      roles={['normal', 'admin', 'superadmin']}
      roleErrorMessage="Désolé, seules les personnes autorisées peuvent supprimer des personnes"
      onConfirm={async () => {
        if (
          !user.healthcareProfessional &&
          (!!medicalFiles.find((c) => c.person === person._id) ||
            !!treatments.find((c) => c.person === person._id) ||
            !!consultations.find((c) => c.person === person._id))
        ) {
          if (
            !window.confirm('Des données médicales sont associées à cette personne. Si vous la supprimez, ces données seront également effacées. Vous n’avez pas accès à ces données médicales car vous n’êtes pas un professionnel de santé. Voulez-vous supprimer cette personne et toutes ses données ?')
          )
            return;
        }
        const personRes = await API.delete({ path: `/person/${person._id}` });
        if (personRes.ok) {
          setPersons((persons) => persons.filter((p) => p._id !== person._id));
          for (const action of actions.filter((a) => a.person === person._id)) {
            const actionRes = await API.delete({ path: `/action/${action._id}` });
            if (actionRes.ok) {
              setActions((actions) => actions.filter((a) => a._id !== action._id));
              for (let comment of comments.filter((c) => c.action === action._id)) {
                const commentRes = await API.delete({ path: `/comment/${comment._id}` });
                if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
              }
            }
          }
          for (let comment of comments.filter((c) => c.person === person._id)) {
            const commentRes = await API.delete({ path: `/comment/${comment._id}` });
            if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
          }
          for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === person._id)) {
            const relRes = await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
            if (relRes.ok) {
              setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace._id));
            }
          }
          for (let passage of passages.filter((c) => c.person === person._id)) {
            const passageRes = await API.delete({ path: `/passage/${passage._id}` });
            if (passageRes.ok) setPassages((passages) => passages.filter((c) => c._id !== passage._id));
          }
          for (let rencontre of rencontres.filter((c) => c.person === person._id)) {
            const rencontreRes = await API.delete({ path: `/rencontre/${rencontre._id}` });
            if (rencontreRes.ok) setRencontres((rencontres) => rencontres.filter((c) => c._id !== rencontre._id));
          }

          for (let medicalFile of medicalFiles.filter((c) => c.person === person._id)) {
            const medicalFileRes = await API.delete({ path: `/medical-file/${medicalFile._id}` });
            if (medicalFileRes.ok) setMedicalFiles((medicalFiles) => medicalFiles.filter((c) => c._id !== medicalFile._id));
          }
          for (let treatment of treatments.filter((c) => c.person === person._id)) {
            const treatmentRes = await API.delete({ path: `/treatment/${treatment._id}` });
            if (treatmentRes.ok) setTreatments((treatments) => treatments.filter((c) => c._id !== treatment._id));
          }
          for (let consultation of consultations.filter((c) => c.person === person._id)) {
            const consultationRes = await API.delete({ path: `/consultation/${consultation._id}` });
            if (consultationRes.ok) setConsultations((consultations) => consultations.filter((c) => c._id !== consultation._id));
          }
        }
        if (personRes?.ok) {
          toast.success('Suppression réussie');
          history.goBack();
        }
      }}>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        Cette opération est irréversible
        <br />
        et entrainera la suppression définitive de toutes les données liées à la personne&nbsp;:
        <br />
        actions, commentaires, lieux visités, passages, rencontres, documents...
      </span>
    </DeleteButtonAndConfirmModal>
  );
};

export default DeletePersonButton;
