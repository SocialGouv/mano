import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { View, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useRecoilValue } from 'recoil';
import { MyText } from '../../components/MyText';
import UserName from '../../components/UserName';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';
import { PersonName } from './PersonRow';

const GroupRow = ({ relation, onMorePress, person }) => {
  const navigation = useNavigation();
  const { persons, description, createdAt, user } = relation;
  const allPersons = useRecoilValue(itemsGroupedByPersonSelector);
  const person1 = useMemo(() => allPersons[persons[0]], [allPersons, persons]);
  const person2 = useMemo(() => allPersons[persons[1]], [allPersons, persons]);

  return (
    <View className="bg-gray-100 rounded-xl flex-row items-center mx-4 my-2">
      <View className="pt-6 pb-1 px-4 grow items-start">
        <View className="flex-row justify-evenly self-stretch items-center">
          <View className="font-bold text-xl shrink-0 grow basis-1/2 flex-wrap ">
            <TouchableWithoutFeedback onPress={() => navigation.push('Person', { person: person1 })}>
              <MyText className={['font-bold text-xl overflow-ellipsis w-full text-center', person1.outOfActiveList ? 'opacity-50' : ''].join(' ')}>
                {person1.name}
              </MyText>
            </TouchableWithoutFeedback>
          </View>
          <MyText className="py-0.5 px-1.5">👪</MyText>
          <View className="font-bold text-xl shrink-0 grow basis-1/2 flex-wrap">
            <TouchableWithoutFeedback onPress={() => navigation.push('Person', { person: person2 })}>
              <MyText className={['font-bold text-xl overflow-ellipsis w-full text-center', person2.outOfActiveList ? 'opacity-50' : ''].join(' ')}>
                {person2.name}
              </MyText>
            </TouchableWithoutFeedback>
          </View>
        </View>
        <View className="mb-5 flex-row justify-center self-stretch">
          <MyText className="text-gray-800 text-justify opacity-75">
            {'\u000A\u000A'}
            {description}
          </MyText>
        </View>
        <MyText className="italic ml-auto my-2 mr-6 text-right text-main">
          {!!user && <UserName caption="Relation créée par" id={user?._id || user} />}
          {'\u000A'}
          {new Date(createdAt).getLocaleDateAndTime('fr')}
        </MyText>
      </View>
      <TouchableOpacity className="flex-row absolute top-4 right-2" hitSlop={hitSlop} onPress={onMorePress}>
        <View className="w-[3px] h-[3px] rounded-full bg-gray-900 opacity-50 mr-[3px]" />
        <View className="w-[3px] h-[3px] rounded-full bg-gray-900 opacity-50 mr-[3px]" />
        <View className="w-[3px] h-[3px] rounded-full bg-gray-900 opacity-50 mr-[3px]" />
      </TouchableOpacity>
    </View>
  );
};

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

export default GroupRow;
