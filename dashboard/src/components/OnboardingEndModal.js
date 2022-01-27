import React from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../recoil/auth';
import ButtonCustom from './ButtonCustom';

//Organisation

const OnboardingEndModal = ({ open, setOpen }) => {
  const organisation = useRecoilValue(organisationState);

  return (
    <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
      <ModalHeader close={<></>} style={{ justifyContent: 'center' }} toggle={() => setOpen(false)}>
        C'est fini !
      </ModalHeader>
      <ModalBody>
        <span style={{ textAlign: 'center', width: '100%', display: 'block' }}>
          Vous avez chiffré votre organisation et créé votre première équipe: <br />
          vous pouvez désormais utiliser Mano !
        </span>
        <br />
        <br />
        Que voulez-vous faire ?
        <br />
        <br />
        <ul>
          <li style={{ marginBottom: 30 }}>
            <b>Paramétrer Mano pour votre organisation :</b> l'activation de l'accueil de jour, l'import de vos données, la personnalisation, etc. en
            cliquant <Link to={`/organisation/${organisation._id}`}>ici</Link> ou dans le volet à gauche sur "Organisation"
          </li>
          <li style={{ marginBottom: 30 }}>
            <b>Ajouter d'autres utilisateurs :</b> en cliquant
            <Link to={`/user`}>{' ici '}</Link> ou dans le volet à gauche sur "Utilisateurs"
          </li>
          <li style={{ marginBottom: 30 }}>
            <b>Ajouter des personnes suivies</b> en cliquant
            <Link to={`/person`}>{' ici '}</Link> ou dans le volet à gauche sur "Personnes suivies". Puis des <Link to={`/action`}>actions</Link> et
            des <Link to={`/place`}>lieux fréquentés</Link> pour ces personnes. Ou bien ajouter des <Link to={`/territory`}>territoires</Link> que
            vous suivez, et enregistrer vos observations jour après jour.
          </li>
        </ul>
        <ButtonCustom onClick={() => setOpen(false)} title="C'est noté, merci !" style={{ margin: '20px auto' }} />
      </ModalBody>
    </Modal>
  );
};

export default OnboardingEndModal;
