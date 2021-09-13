import React from 'react';
import { Alert } from 'react-native';
import API from '../../services/api';
import { PersonIcon } from '../../icons';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Row from '../../components/Row';
import Spinner from '../../components/Spinner';
import { ListEmptyStructures } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import FlatListStyled from '../../components/FlatListStyled';
import StructuresContext from '../../contexts/structures';
import withContext from '../../contexts/withContext';

class Structures extends React.Component {
  state = {
    refreshing: false,
    loading: true,
    search: '',
  };

  componentDidMount() {
    this.getStructures(false);
  }

  componentWillUnmount() {
    clearTimeout(this.searchTimeout);
  }

  getStructures = async (refresh = true) => {
    if (refresh) this.setState({ refreshing: true });
    const response = await API.execute({ path: '/structure' });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ refreshing: false });
    }
    if (response.ok) {
      this.props.context.setStructures(response.data);
      this.setState({ refreshing: false, loading: false });
    }
  };

  onSearchStart = () => {
    this.props.context.setStructures([]);
    this.setState({ loading: true });
  };
  onSearchComplete = (structures) => {
    this.props.context.setStructures(structures);
    this.setState({ refreshing: false, loading: false });
  };

  onCreateStructureRequest = () =>
    this.props.navigation.navigate('NewStructureForm', { fromRoute: 'StructuresList' });

  keyExtractor = (structure) => structure._id;
  renderRow = ({ item: structure }) => {
    const { name } = structure;
    const { push } = this.props.navigation;
    return (
      <Row
        withNextButton
        onPress={() => push('Structure', { ...structure, fromRoute: 'StructuresList' })}
        Icon={PersonIcon}
        caption={name}
      />
    );
  };

  render() {
    const { refreshing, loading } = this.state;
    const { structures, key } = this.props.context;
    return (
      <SceneContainer>
        <ScreenTitle title="Structures" />
        <FlatListStyled
          refreshing={refreshing}
          onRefresh={this.getStructures}
          data={loading ? [] : structures}
          extraData={key}
          renderItem={this.renderRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyStructures}
          defaultTop={0}
        />
        <FloatAddButton onPress={this.onCreateStructureRequest} />
      </SceneContainer>
    );
  }
}

export default withContext(StructuresContext)(Structures);
