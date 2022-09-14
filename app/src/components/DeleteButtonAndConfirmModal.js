import React, { useState } from 'react';
import styled from 'styled-components';
import { Alert, Modal } from 'react-native';
import colors from '../utils/colors';
import ButtonDelete from './ButtonDelete';
import ButtonsContainer from './ButtonsContainer';
import InputLabelled from './InputLabelled';
import SceneContainer from './SceneContainer';
import ScreenTitle from './ScreenTitle';
import ScrollContainer from './ScrollContainer';
import { SubTitle } from './Title';
import { MyText } from './MyText';
import { useRecoilValue } from 'recoil';
import { userState } from '../recoil/auth';

const DeleteButtonAndConfirmModal = ({ children, title, onDelete, onBack, textToConfirm }) => {
  const user = useRecoilValue(userState);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [textConfirmed, setTextConfirmed] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onDeleteRequest = () => {
    if (!['admin'].includes(user.role)) {
      Alert.alert("Désolé, seul un admin peut supprimer ce type d'élément");
      return;
    }
    setShowConfirmDelete(true);
  };
  const onDeleteConfirm = async () => {
    if (!textConfirmed) return Alert.alert('Veuillez rentrer le texte demandé');
    if (textConfirmed.trim().toLocaleLowerCase() !== textToConfirm.trim().toLocaleLowerCase()) {
      return Alert.alert('Le texte renseigné est incorrect');
    }
    if (textConfirmed.trim() !== textToConfirm.trim()) {
      return Alert.alert('Veuillez respecter les minuscules/majuscules');
    }
    const isSuccess = await onDelete();
    setDeleting(false);
    if (isSuccess) {
      setShowConfirmDelete(false);
      onBack();
    }
  };

  return (
    <>
      <ButtonDelete onPress={onDeleteRequest} deleting={deleting} />
      <Modal animationType="fade" visible={!!showConfirmDelete}>
        <SceneContainer>
          <ScreenTitle title={title} onBack={() => setShowConfirmDelete(false)} />
          <ScrollContainer>
            <SubTitle>{children}</SubTitle>
            <SubTitle>Veuillez taper le texte ci-dessous pour confirmer{'\n'}en respectant les majuscules, minuscules ou accents</SubTitle>
            <TextToConfirm bold color={colors.delete.color}>
              {textToConfirm}
            </TextToConfirm>
            <InputLabelled
              value={textConfirmed}
              onChangeText={setTextConfirmed}
              placeholder={textToConfirm}
              editable
              onSubmitEditing={onDeleteConfirm}
            />
            <ButtonsContainer>
              <ButtonDelete onPress={onDeleteConfirm} deleting={deleting} />
            </ButtonsContainer>
          </ScrollContainer>
        </SceneContainer>
      </Modal>
    </>
  );
};

const TextToConfirm = styled(MyText)`
  align-self: center;
  margin-bottom: 15px;
`;

export default DeleteButtonAndConfirmModal;
