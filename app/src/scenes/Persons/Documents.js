import React from 'react';
import ScrollContainer from '../../components/ScrollContainer';
import SubHeader from '../../components/SubHeader';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import colors from '../../utils/colors';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import PersonsContext from '../../contexts/persons';
import { findNodeHandle } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import API from '../../services/api';

class FileSocial extends React.Component {
  _scrollToInput = (ref) => {
    if (!ref) return;
    setTimeout(() => {
      ref.measureLayout(
        findNodeHandle(this.scrollView),
        (x, y, width, height) => {
          this.scrollView.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  render() {
    const {
      editable,
      updating,

      navigation,
      onUpdatePerson,
      onEdit,
      isUpdateDisabled,
      backgroundColor,
    } = this.props;

    return (
      <>
        <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Dossier social" />
        <ScrollContainer ref={(r) => (this.scrollView = r)} backgroundColor={backgroundColor || colors.app.color}>
          <ButtonsContainer>
            <Button
              caption={'ajouter une photo'}
              onPress={async () => {
                const result = await launchCamera();
                if (result.didCancel) return;
                if (result.errorCode) return;
              }}
              disabled={false}
              loading={updating}
            />
            <Button
              caption={'Sélectionner une photo'}
              onPress={async () => {
                const result = await launchImageLibrary({
                  includeBase64: true,
                  mediaType: 'photo',
                });
                if (result.didCancel) return;
                if (result.errorCode) return;
                const asset = result.assets[0];
                const img = {
                  uri: asset.uri,
                  name: asset.filename,
                  type: asset.type,
                };
                API.upload({
                  file: img,
                  path: `/person/99329329/document`,
                });
              }}
              disabled={false}
              loading={updating}
            />
          </ButtonsContainer>
        </ScrollContainer>
      </>
    );
  }
}

export default compose(withContext(PersonsContext))(FileSocial);
