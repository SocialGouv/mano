import React, { useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SubHeader from '../../components/SubHeader';
import Spacer from '../../components/Spacer';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import colors from '../../utils/colors';
import CustomFieldInput from '../../components/CustomFieldInput';
import { currentTeamState, userState } from '../../recoil/auth';

const PersonSection = ({
  navigation,
  editable,
  onChange,
  onUpdatePerson,
  onEdit,
  isUpdateDisabled,
  updating,
  backgroundColor,
  person,
  fields,
  name: sectionName,
}) => {
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const scrollViewRef = useRef(null);
  const refs = useRef({});
  const _scrollToInput = (ref) => {
    if (!ref) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref?.measureLayout?.(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  return (
    <>
      <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption={sectionName} />
      <ScrollContainer ref={scrollViewRef} backgroundColor={backgroundColor || colors.app.color}>
        <View>
          {!editable && <Spacer />}
          {(fields || [])
            .filter((f) => f)
            .filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
            .filter((f) => !f.onlyHealthcareProfessional || user?.healthcareProfessional)
            .map((field) => {
              const { label, name } = field;
              return (
                <CustomFieldInput
                  label={label}
                  key={label}
                  field={field}
                  value={person[name]}
                  handleChange={(newValue) => onChange({ [name]: newValue })}
                  editable={editable}
                  ref={(r) => (refs.current[`${name}-ref`] = r)}
                  onFocus={() => _scrollToInput(refs.current[`${name}-ref`])}
                />
              );
            })}
          <ButtonsContainer>
            <Button
              caption={editable ? 'Mettre à jour' : 'Modifier'}
              onPress={editable ? onUpdatePerson : onEdit}
              disabled={editable ? isUpdateDisabled : false}
              loading={updating}
            />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </>
  );
};

export default PersonSection;
