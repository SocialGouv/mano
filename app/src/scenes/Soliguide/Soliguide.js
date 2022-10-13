import React, { useRef } from 'react';
import { Animated } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import WebView from 'react-native-webview';

const Soliguide = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  return (
    <SceneContainer>
      <ScreenTitle title="Soliguide" parentScroll={scrollY} />
      <WebView source={{ uri: 'https://soliguide.fr/' }} containerStyle={{ marginTop: 90 }} />
    </SceneContainer>
  );
};

export default Soliguide;
