import React from 'react';
import { Alert } from 'react-native';
import API from '../../api';
import SelectLabelled from '../../components/SelectLabelled';

export const initStructure = {
  _id: '0',
  name: '-- Choissisez une structure --',
};

const noStructure = {
  _id: '1',
  name: '-- Aucune structure --',
};

class StructureSelect extends React.Component {
  state = {
    structures: null,
    key: 0,
  };

  componentDidMount() {
    this.getStructures();
  }

  getStructures = async () => {
    const response = await API.get({ path: '/structure' });
    if (response.error) return Alert.alert(response.error);
    const structures = response.data;
    structures.unshift(noStructure);
    structures.unshift(initStructure);
    this.setState(({ key }) => ({ structures, key: key + 1 }));
  };

  render() {
    const { structures, key } = this.state;
    const { value, onSelect } = this.props;
    return (
      <SelectLabelled
        key={key}
        label="Structure"
        values={structures ? structures : [value]}
        value={structures ? structures.find((u) => u._id === value._id) || initStructure : value}
        onSelect={onSelect}
      />
    );
  }
}

export default StructureSelect;
