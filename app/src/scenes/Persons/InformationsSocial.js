import React, { useRef } from 'react';
import { useRecoilValue } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SubHeader from '../../components/SubHeader';
import AnimalsSelect from '../../components/Selects/AnimalsSelect';
import NationalitySituationSelect from '../../components/Selects/NationalitySituationSelect';
import YesNoSelect from '../../components/Selects/YesNoSelect';
import RessourcesMultiCheckBoxes from '../../components/MultiCheckBoxes/RessourcesMultiCheckBoxes';
import WhyHomelessMultiCheckBoxes from '../../components/MultiCheckBoxes/WhyHomelessMultiCheckBoxes';
import Spacer from '../../components/Spacer';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import InputLabelled from '../../components/InputLabelled';
import EmploymentSituationSelect from '../../components/Selects/EmploymentSituationSelect';
import AddressDetailSelect, { isFreeFieldAddressDetail } from '../../components/Selects/AddressDetailSelect';
import colors from '../../utils/colors';
import CustomFieldInput from '../../components/CustomFieldInput';
import { customFieldsPersonsSocialSelector, personFieldsSelector } from '../../recoil/persons';
import { currentTeamState } from '../../recoil/auth';

const InformationsSocial = ({ navigation, editable, updating, onChange, onUpdatePerson, onEdit, isUpdateDisabled, backgroundColor, person }) => {
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const currentTeam = useRecoilValue(currentTeamState);
  const personFields = useRecoilValue(personFieldsSelector);
  const addressDetails = personFields.find((f) => f.name === 'addressDetail').options;
  const scrollViewRef = useRef(null);
  const refs = useRef({});
  const _scrollToInput = (ref) => {
    if (!ref) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.measureLayout(
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
      <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Informations sociales" />
      <ScrollContainer ref={scrollViewRef} backgroundColor={backgroundColor || colors.app.color}>
        <InputLabelled
          label="Structure de suivi social"
          onChangeText={(structureSocial) => onChange({ structureSocial })}
          value={person.structureSocial || (editable ? null : '-- Non renseignée --')}
          placeholder="Renseignez la structure sociale le cas échéant"
          editable={editable}
        />
        <AnimalsSelect value={person.hasAnimal} onSelect={(hasAnimal) => onChange({ hasAnimal })} editable={editable} />
        <NationalitySituationSelect
          value={person.nationalitySituation}
          onSelect={(nationalitySituation) => onChange({ nationalitySituation })}
          editable={editable}
        />
        <EmploymentSituationSelect value={person.employment} onSelect={(employment) => onChange({ employment })} editable={editable} />
        <YesNoSelect label="Hébergement" value={person.address} onSelect={(address) => onChange({ address })} editable={editable} />
        {person.address === 'Oui' && (
          <>
            <AddressDetailSelect value={person.addressDetail} onSelect={(addressDetail) => onChange({ addressDetail })} editable={editable} />
            {!!isFreeFieldAddressDetail(person.addressDetail, addressDetails) && !!editable && (
              <InputLabelled
                onChangeText={(addressDetail) => onChange({ addressDetail: addressDetail || 'Autre' })}
                value={person.addressDetail === 'Autre' ? '' : person.addressDetail}
                placeholder="Renseignez le type d'hébergement particulier le cas échéant"
                editable={editable}
              />
            )}
          </>
        )}
        <RessourcesMultiCheckBoxes values={person.resources} onChange={(resources) => onChange({ resources })} editable={editable} />
        <WhyHomelessMultiCheckBoxes values={person.reasons} onChange={(reasons) => onChange({ reasons })} editable={editable} />
        {!editable && <Spacer />}
        {(customFieldsPersonsSocial || [])
          .filter((f) => f)
          .filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
          .map((field) => {
            const { label, name } = field;
            return (
              <CustomFieldInput
                label={label}
                key={field.name}
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
      </ScrollContainer>
    </>
  );
};

export default InformationsSocial;
