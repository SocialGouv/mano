import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Dimensions } from 'react-native';
import { MyText } from './MyText';
import colors from '../utils/colors';
import picture1 from '../assets/MANO_livraison_elements-04.png';
import picture2 from '../assets/MANO_livraison_elements-05.png';
import picture3 from '../assets/MANO_livraison_elements_Plan_de_travail.png';
import { useRefresh } from '../recoil/refresh';

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const Loader = () => {
  const { loading, progress, fullScreen } = useRefresh();
  const [picture, setPicture] = useState([picture1, picture3, picture2][randomIntFromInterval(0, 2)]);

  useEffect(() => {
    setPicture([picture1, picture3, picture2][randomIntFromInterval(0, 2)]);
  }, [fullScreen]);

  if (!loading) return null;
  return (
    <Container fullScreen={fullScreen}>
      {!!fullScreen && <ImageStyled source={picture} />}
      <Caption>{loading}</Caption>
      <ProgressContainer fullScreen={fullScreen}>
        <Progress progress={progress} />
      </ProgressContainer>
    </Container>
  );
};

const Container = styled.SafeAreaView`
  width: 100%;
  background-color: ${colors.app.color};
  ${(p) => !p.fullScreen && 'position: absolute;'}
  ${(p) => !p.fullScreen && 'top: 0;'}
  ${(p) => p.fullScreen && 'height: 100%;'}
  ${(p) => p.fullScreen && 'justify-content: center;'}
  ${(p) => p.fullScreen && 'align-items: center;'}
`;

const ImageStyled = styled.Image`
  width: ${Dimensions.get('window').width * 0.8}px;
  height: ${Dimensions.get('window').width * 0.8}px;
`;

const Caption = styled(MyText)`
  /* width: 100%; */
  color: #fff;
  padding: 5px;
`;

const ProgressContainer = styled.View`
  width: 100%;
  height: 7px;
  ${(p) => p.fullScreen && 'width: 75%;'}
  ${(p) => p.fullScreen && 'border-radius: 7px;'}
  ${(p) => p.fullScreen && 'overflow: hidden;'}
  ${(p) => p.fullScreen && 'margin: 15px;'}
  ${(p) => p.fullScreen && 'border: 1px solid #fff;'}
`;

const Progress = styled.View`
  width: ${(p) => p.progress * 100}%;
  min-width: 5%;
  height: 100%;
  background-color: #fff;
`;

export default Loader;
