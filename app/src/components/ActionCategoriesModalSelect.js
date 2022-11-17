import React, { useState, useMemo, useRef } from 'react';
import { selector, useRecoilValue } from 'recoil';
import { TouchableOpacity, View, ScrollView, Modal } from 'react-native';
import { actionsCategoriesSelector, actionsState } from '../recoil/actions';
import Label from './Label';
import { MyText } from './MyText';
import Row from './Row';
import Tags from './Tags';
import SceneContainer from './SceneContainer';
import ScreenTitle from './ScreenTitle';
import ScrollContainer from './ScrollContainer';
import { FlashList } from '@shopify/flash-list';
import Search from './Search';

const categoriesSortedByMostUsedSelector = selector({
  key: 'categoriesSortedByMostUsedSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const categories = {};
    for (const action of actions) {
      if (!action.categories) continue;
      for (const category of action.categories) {
        if (!categories[category]) categories[category] = 0;
        categories[category]++;
      }
    }

    return Object.entries(categories) // [[{category}, {count}], [{category}, {count}]]
      .sort(([_, countCat1], [__, countCat2]) => countCat2 - countCat1)
      .map(([category]) => category);
  },
});

const ActionCategoriesModalSelect = ({ values = [], onChange, editable, withMostUsed }) => {
  const [open, setOpen] = useState(false);
  const allGroups = useRecoilValue(actionsCategoriesSelector);
  const categoriesSortedByMostUsed = useRecoilValue(categoriesSortedByMostUsedSelector);

  const [search, setSearch] = useState('');
  const [groupSelected, setGroupSelected] = useState(allGroups[0].groupTitle);

  const mostUsedCategoriesToShow = useMemo(
    () => categoriesSortedByMostUsed.filter((category) => !values.some((_category) => _category === category)).slice(0, 5),
    [categoriesSortedByMostUsed, values]
  );

  const groups = useMemo(() => {
    if (!search && !values.length) return allGroups;
    return allGroups.map(({ groupTitle, categories }) => {
      if (search) {
        categories = categories.filter((_category) => _category.toLowerCase().trim().includes(search.toLowerCase().trim()));
      }
      if (values.length) {
        categories = categories.filter((_category) => !values.includes(_category));
      }
      return { groupTitle, categories };
    });
  }, [search, values, allGroups]);

  const categories = useMemo(() => {
    const group = groups.find((group) => group.groupTitle === groupSelected);
    return group?.categories || [];
  }, [groupSelected, groups]);

  const selectedCategoriesRef = useRef(null);

  return (
    <>
      <Label label="Catégories" />
      <Tags
        data={values}
        onChange={onChange}
        editable={editable}
        onAddRequest={() => setOpen(true)}
        renderTag={(category) => <MyText>{category}</MyText>}
      />
      <ScrollView horizontal className="flex-grow-0 flex-shrink-0 -mt-8 mb-8 -mx-[30px] px-2">
        <MyText className="self-center">Catégories les plus utilisées: </MyText>
        {!!withMostUsed &&
          mostUsedCategoriesToShow.map((category) => (
            <TouchableOpacity
              onPress={() => onChange([...values, category])}
              className="rounded-full ml-2 px-2 py-1 border border-main"
              key={category}>
              <MyText>{category}</MyText>
            </TouchableOpacity>
          ))}
      </ScrollView>
      <Modal animationType="fade" visible={!!open} onRequestClose={() => setOpen(false)}>
        <SceneContainer>
          <ScreenTitle title="Catégories de l'action" onBack={() => setOpen(false)} />
          <ScrollContainer scrollEnabled={false} noPadding>
            <Search placeholder="Rechercher une catégorie..." onChange={setSearch} />
            <ScrollView ref={selectedCategoriesRef} horizontal className="flex-grow-0 flex-shrink-0">
              <Tags
                data={values}
                disableAdd
                onChange={onChange}
                editable
                renderTag={(category) => <MyText>{category}</MyText>}
                className="min-h-0 m-0"
              />
            </ScrollView>
            <ScrollView contentContainerStyle={{ paddingVertical: 16 }} horizontal className="flex-grow-0 flex-shrink-0">
              {groups.map((group) => (
                <TouchableOpacity
                  onPress={() => setGroupSelected(group.groupTitle)}
                  className={['rounded-full ml-2 px-2 py-1 border border-main', groupSelected === group.groupTitle ? 'bg-main' : ''].join(' ')}
                  key={group.groupTitle}>
                  <MyText className={[groupSelected === group.groupTitle ? 'text-white' : ''].join(' ')}>
                    {group.groupTitle} ({group.categories.length})
                  </MyText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="flex-grow flex-shrink h-96">
              <FlashList
                data={categories}
                renderItem={({ item: category }) => (
                  <Row
                    onPress={() => {
                      selectedCategoriesRef.current.scrollToEnd();
                      onChange([...values, category]);
                    }}
                    caption={category}
                  />
                )}
                estimatedItemSize={70}
              />
            </View>
          </ScrollContainer>
        </SceneContainer>
      </Modal>
    </>
  );
};

export default ActionCategoriesModalSelect;
