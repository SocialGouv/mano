import React from 'react';
import ScrollContainer from '../../components/ScrollContainer';
import SubHeader from '../../components/SubHeader';
import HealthInsuranceSelect from '../../components/Selects/HealthInsuranceSelect';
import VulnerabilitiesMultiCheckBoxes from '../../components/MultiCheckBoxes/VulnerabilitiesMultiCheckBoxes';
import ConsumptionsMultiCheckBoxes from '../../components/MultiCheckBoxes/ConsumptionsMultiCheckBoxes';
import Spacer from '../../components/Spacer';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import { View } from 'react-native';
import InputLabelled from '../../components/InputLabelled';
import colors from '../../utils/colors';

class FileMedical extends React.Component {
  render() {
    const {
      editable,
      structureMedical,
      healthInsurance,
      vulnerabilities,
      consumptions,
      onChange,
      navigation,
      onUpdatePerson,
      onEdit,
      isUpdateDisabled,
      updating,
      backgroundColor,
    } = this.props;

    return (
      <>
        <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Dossier médical" />
        <ScrollContainer backgroundColor={backgroundColor || colors.app.color}>
          <View>
            <HealthInsuranceSelect value={healthInsurance} onSelect={(healthInsurance) => onChange({ healthInsurance })} editable={editable} />

            <InputLabelled
              label="Structure de suivi médical"
              onChangeText={(structureMedical) => onChange({ structureMedical })}
              value={structureMedical || (editable ? null : '-- Non renseignée --')}
              placeholder="Renseignez la structure médicale le cas échéant"
              editable={editable}
            />
            <VulnerabilitiesMultiCheckBoxes
              values={vulnerabilities}
              onChange={(vulnerabilities) => onChange({ vulnerabilities })}
              editable={editable}
            />
            <ConsumptionsMultiCheckBoxes values={consumptions} onChange={(consumptions) => onChange({ consumptions })} editable={editable} />
            {!editable && <Spacer />}
            <ButtonsContainer>
              <Button
                caption={editable ? 'Mettre-à-jour' : 'Modifier'}
                onPress={editable ? onUpdatePerson : onEdit}
                disabled={editable ? isUpdateDisabled() : false}
                loading={updating}
              />
            </ButtonsContainer>
          </View>
        </ScrollContainer>
      </>
    );
  }
}

export default FileMedical;
