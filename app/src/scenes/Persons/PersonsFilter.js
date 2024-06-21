import React, { useState } from 'react';
import styled from 'styled-components/native';
import { View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import { MyText } from '../../components/MyText';
import colors from '../../utils/colors';
import OutOfActiveListSelect from '../../components/Selects/OutOfActiveListSelect';
import { useRecoilValue } from 'recoil';
import { teamsState } from '../../recoil/auth';

const PersonsFilter = ({ route, navigation }) => {
  const [filterAlertness, setFilterAlertness] = useState(route.params?.filters?.filterAlertness || false);
  const [filterTeams, setFilterByTeam] = useState(route.params?.filters?.filterTeams || []);
  const [filterOutOfActiveList, setFilterOutOfActiveList] = useState(route.params?.filters?.filterOutOfActiveList || '');
  const teams = useRecoilValue(teamsState);

  const onBackRequested = () => {
    navigation.navigate('PersonsList', { filters: { filterAlertness, filterTeams, filterOutOfActiveList } });
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Filtres" onBack={onBackRequested} />
      <ScrollContainer>
        <CheckboxLabelled
          label="N'afficher que les personnes identifiées comme vulnérables ou ayant besoin d'une attention particulière"
          value={filterAlertness}
          onPress={() => setFilterAlertness(!filterAlertness)}
        />
        <Category>Filtrer par équipe en charge</Category>
        {teams.map(({ _id, name }, i) => {
          const isSelected = filterTeams.includes(_id);
          return (
            <CheckboxLabelled
              key={_id}
              label={name}
              value={isSelected}
              onPress={() => setFilterByTeam(isSelected ? filterTeams.filter((teamId) => teamId !== _id) : [...filterTeams, _id])}
            />
          );
        })}
        <OutOfActiveListSelectWapper>
          <OutOfActiveListSelect value={filterOutOfActiveList} editable={true} onSelect={(value) => setFilterOutOfActiveList(value)} />
        </OutOfActiveListSelectWapper>
      </ScrollContainer>
    </SceneContainer>
  );
};

const OutOfActiveListSelectWapper = styled(View)`
  margin-top: 20px;
`;

const Category = styled(MyText)`
  font-size: 15px;
  color: ${colors.app.color};
  margin: 15px 0;
`;

export default PersonsFilter;
