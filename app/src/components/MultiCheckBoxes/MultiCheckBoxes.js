import React, { useState } from 'react';
import CheckboxLabelled from '../CheckboxLabelled';
import InputLabelled from '../InputLabelled';
import Label from '../Label';
import { View, TouchableOpacity } from 'react-native';
import { MyText } from '../MyText';

const MultiCheckBoxes = ({ label, source, values, onChange, editable, emptyValue, allowCreateOption }) => {
  const [saisieLibre, setSaisieLibre] = useState('');

  if (!Array.isArray(values)) values = [];
  if (!editable) {
    return <InputLabelled label={label} value={values.length ? values.join(', ') : emptyValue} editable={false} />;
  }

  const onCheck = ({ _id: newValue }) => {
    const newValues = values.includes(newValue) ? values.filter((v) => v !== newValue) : [...values, newValue];
    onChange(newValues);
  };

  function onAddSaisieLibre() {
    onCheck({ _id: saisieLibre });
    setSaisieLibre('');
  }

  return (
    <View>
      {label && <Label label={label} />}
      <View className="mt-2.5 flex-wrap justify-start">
        {[...source, ...values.filter((value) => !source.includes(value))].map((value) => (
          <View className="rounded-xl bg-white grow shrink-0 border border-gray-200 w-full mb-3 justify-center" key={value}>
            <CheckboxLabelled onPress={onCheck} label={value} value={values.includes(value)} _id={value} />
          </View>
        ))}
      </View>
      {allowCreateOption && (
        <InputLabelled onChangeText={setSaisieLibre} value={saisieLibre} placeholder="Autre (précisez)" editable>
          <View className="absolute right-3 justify-center items-center self-center h-full">
            <TouchableOpacity
              onPress={onAddSaisieLibre}
              className="justify-center border-main75 border items-center self-center flex-row py-2 px-2 rounded-md">
              <MyText className="self-center text-main75 justify-center text-xs">Ajouter</MyText>
            </TouchableOpacity>
          </View>
        </InputLabelled>
      )}
    </View>
  );
};

export default MultiCheckBoxes;

// export const computeMultiCheck = (multiCheckSource, multiCheckDB) =>
//   multiCheckSource.map((check) => ({ ...check, value: multiCheckDB[check._id] || false }));

// export const areChecksSame = (checks1, checks2) => {
//   for (let _id of Object.keys(checks1)) {
//     if (Boolean(checks1[_id]) !== Boolean(checks2[_id])) return false;
//   }
//   return true;
// };
