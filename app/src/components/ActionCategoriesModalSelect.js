import React, { useState, useMemo, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { TouchableOpacity, View, ScrollView, Modal } from 'react-native';
import { actionsCategoriesSelector } from '../recoil/actions';
import Label from './Label';
import { MyText } from './MyText';
import Row from './Row';
import Tags from './Tags';
import SceneContainer from './SceneContainer';
import ScreenTitle from './ScreenTitle';
import ScrollContainer from './ScrollContainer';
import { FlashList } from '@shopify/flash-list';
import Search from './Search';

const ActionCategoriesModalSelect = ({ values = [], onChange, editable }) => {
  const [open, setOpen] = useState(false);
  const allGroups = useRecoilValue(actionsCategoriesSelector);
  const [search, setSearch] = useState('');
  const [groupSelected, setGroupSelected] = useState(allGroups[0].groupTitle);

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
