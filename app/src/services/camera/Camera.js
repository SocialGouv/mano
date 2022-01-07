import React from 'react';
import styled from 'styled-components';
import { TouchableWithoutFeedback, Modal } from 'react-native';
import { RNCamera } from 'react-native-camera';
import TorchIcon from './TorchIcon';
import CrossIcon from './CrossIcon';
import PictureButton from './PictureButton';
import debugError from '../debugError';
import i18n from '../../api/i18n';
import { MyText } from '../../components/MyText';

const hitSlop = {
  bottom: 40,
  left: 40,
  right: 40,
  top: 40,
};

class Camera extends React.Component {
  state = { withTorch: false };

  toggleTorch = () => this.setState(({ withTorch }) => ({ withTorch: !withTorch }));

  takePicture = async () => {
    if (this.camera) {
      const options = { quality: 0.5, base64: true };
      const data = await this.camera.takePictureAsync(options);
      this.props.onTakePicture({ type: 'image/jpg', uri: data.uri });
    }
  };
  render() {
    const {
      visible,
      onClose,
      hint,
      children,
      onBarCodeRead,
      androidCameraPermissionOptions,
    } = this.props;
    const { withTorch } = this.state;

    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <CameraContainer>
          <Preview
            type={RNCamera.Constants.Type.back}
            flashMode={
              withTorch ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off
            }
            ref={(ref) => {
              this.camera = ref;
            }}
            captureAudio={false}
            androidCameraPermissionOptions={androidCameraPermissionOptions}
            onBarCodeRead={onBarCodeRead}
          />
          <ButtonsContainerSafe>
            {Boolean(hint) && <BarCodeHint>{hint}</BarCodeHint>}
            {Boolean(children) && (
              <ButtonsContainer justifyContent="space-around">{children}</ButtonsContainer>
            )}
            {!children && (
              <ButtonsContainer justifyContent="center">
                <PictureButton size={50} onPress={this.takePicture} />
              </ButtonsContainer>
            )}
          </ButtonsContainerSafe>
          <CameraButtonsContainerSafe>
            <ButtonsContainer justifyContent="space-between">
              <TouchableWithoutFeedback onPress={this.toggleTorch} hitSlop={hitSlop}>
                <CameraButton>
                  <TorchIcon size={20} showWithCrossLine={withTorch} />
                </CameraButton>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={onClose} hitSlop={hitSlop}>
                <CameraButton>
                  <CrossIcon size={20} />
                </CameraButton>
              </TouchableWithoutFeedback>
            </ButtonsContainer>
          </CameraButtonsContainerSafe>
        </CameraContainer>
      </Modal>
    );
  }
}

const CameraContainer = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  flex: 1;
  flex-direction: column;
  background-color: #191919;
`;

const Preview = styled(RNCamera)`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
`;

const ButtonsContainerSafe = styled.SafeAreaView`
  position: absolute;
  margin: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: black;
`;

const CameraButtonsContainerSafe = styled.SafeAreaView`
  position: absolute;
  margin: 0;
  top: 0;
  left: 0;
  right: 0;
  background-color: black;
`;

const CameraButton = styled.View`
  padding: 10px;
  justify-content: center;
  align-items: center;
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: ${(props) => props.justifyContent};
  margin: 0;
  width: 100%;
  padding: 10px;
  align-items: center;
`;

const BarCodeHint = styled(MyText)`
  position: absolute;
  top: -25px;
  height: 25px;
  line-height: 25px;
  color: black;
  text-align: center;
  text-align-vertical: center;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-weight: bold;
  background-color: #f9f9f9;
`;

Camera.defaultProps = {
  androidCameraPermissionOptions: {
    title: "Permission pour utiliser l'appareil photo",
    message:
      'Oz Ensemble souhaite accéder à votre appareil photo afin de lire les codes barres des produits que vous scannez',
    buttonPositive: 'Ok',
    buttonNegative: i18n.t('cancel'),
  },
  visible: false,
  onClose: () => debugError('provide onClose function to Camera'),
  onBarCodeRead: () => debugError('provide an onBarCodeRead function to Camera'),
  hint: 'You can put a hint here if you need',
};

export default Camera;
