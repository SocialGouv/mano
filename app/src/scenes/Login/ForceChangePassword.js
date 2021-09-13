import React from 'react';
import styled from 'styled-components';
import SceneContainer from '../../components/SceneContainer';
import colors from '../../utils/colors';
import { ChangePasswordBody } from './ChangePassword';
import { MyText } from '../../components/MyText';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import { compose } from 'recompose';
import RefreshContext from '../../contexts/refresh';

const ForceChangePassword = ({ navigation, context }) => {
  const onOk = () => {
    if (context.teams?.length === 1) {
      context.refresh({ initialLoad: true });
      context.setCurrentTeam(context?.teams[0]);
      navigation.navigate('Home');
    } else {
      navigation.navigate('TeamSelection');
    }
  };

  return (
    <Background>
      <SceneContainer>
        <ChangePasswordBody onOK={onOk}>
          <Title>Mot de passe expiré</Title>
          <SubTitle>Veuillez confirmer votre mot de passe et saisir un nouveau</SubTitle>
        </ChangePasswordBody>
      </SceneContainer>
    </Background>
  );
};

const Background = styled.View`
  flex: 1;
  background-color: #fff;
`;

const Title = styled(MyText)`
  background-color: ${colors.app.color};
  padding-horizontal: 30px;
  padding-vertical: 15px;
  font-weight: bold;
  font-style: italic;
  font-size: 22px;
  margin-top: 20%;
  align-self: center;
  color: #fff;
`;

const SubTitle = styled(MyText)`
  font-size: 13px;
  margin-top: 15%;
  margin-bottom: 10%;
  align-self: center;
  text-align: center;
`;

export default compose(withContext(AuthContext), withContext(RefreshContext))(ForceChangePassword);
