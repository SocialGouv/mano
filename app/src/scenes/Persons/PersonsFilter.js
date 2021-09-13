/* eslint-disable max-len */
import React, { useState } from 'react';
import styled from 'styled-components';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import { MyText } from '../../components/MyText';
import colors from '../../utils/colors';
import { compose } from 'recompose';
import AuthContext from '../../contexts/auth';
import withContext from '../../contexts/withContext';
import PersonsContext from '../../contexts/persons';

const PersonsFilter = ({ route, context, navigation }) => {
  const [filterAlertness, setFilterAlertness] = useState(
    route.params?.filters?.filterAlertness || false
  );
  const [filterTeams, setFilterByTeam] = useState(route.params?.filters?.filterTeams || []);

  const onBackRequested = () => {
    navigation.navigate('PersonsList', { filters: { filterAlertness, filterTeams } });
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Filtres" onBack={onBackRequested} />
      <ScrollContainer>
        <CheckboxLabelled
          label="N'afficher que les personnes identifiées comme vulnérables où ayant besoin d'une attention particulière"
          value={filterAlertness}
          onPress={() => setFilterAlertness(!filterAlertness)}
        />
        <Category>Filtrer par équipe en charge</Category>
        {context.teams.map(({ _id, name }, i) => {
          const isSelected = filterTeams.includes(_id);
          return (
            <CheckboxLabelled
              key={_id}
              label={name}
              value={isSelected}
              onPress={() =>
                setFilterByTeam(
                  isSelected
                    ? filterTeams.filter((teamId) => teamId !== _id)
                    : [...filterTeams, _id]
                )
              }
            />
          );
        })}
      </ScrollContainer>
    </SceneContainer>
  );
};

const Category = styled(MyText)`
  font-size: 15px;
  color: ${colors.app.color};
  margin-vertical: 15px;
`;

export default compose(withContext(AuthContext), withContext(PersonsContext))(PersonsFilter);
