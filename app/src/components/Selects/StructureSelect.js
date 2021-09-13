import React from 'react';
import { Alert } from 'react-native';
import API from '../../services/api';
import SelectLabelled from './SelectLabelled';

export const initStructure = {
  _id: null,
  name: '-- Aucune --',
};

class StructureSelect extends React.Component {
  state = {
    structures: [initStructure],
    key: 0,
  };

  componentDidMount() {
    this.getStructures();
  }

  getStructures = async () => {
    const response = await API.get({ path: '/structure' });
    if (response.error) return Alert.alert(response.error);
    const structures = response.data;
    structures.unshift(initStructure);
    this.setState(({ key }) => ({ structures, key: key + 1 }));
  };

  render() {
    const { structures, key } = this.state;
    const { value, onSelect, editable } = this.props;
    return (
      <SelectLabelled
        key={key}
        label="Structure"
        mappedIdsToLabels={structures}
        values={structures.map((s) => s._id)}
        value={value}
        onSelect={onSelect}
        editable={editable}
      />
    );
  }
}

export default StructureSelect;
