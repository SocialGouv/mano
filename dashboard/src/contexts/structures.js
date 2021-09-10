import React from 'react';

const StructuresContext = React.createContext();

export class StructuresProvider extends React.Component {
  state = { structures: [], strctureKey: 0 };

  setStructures = (structures) => this.setState(({ strctureKey }) => ({ structures, strctureKey: strctureKey + 1 }));
  deleteStructure = (id) =>
    this.setState(({ structures, strctureKey }) => ({
      strctureKey: strctureKey + 1,
      structures: structures.filter((p) => p._id !== id),
    }));
  addStructure = (structure) =>
    this.setState(({ structures, strctureKey }) => ({
      strctureKey: strctureKey + 1,
      structures: [...structures, structure].sort((s1, s2) => {
        if (s1.name < s2.name) return -1;
        if (s1.name > s2.name) return 1;
        return 0;
      }),
    }));
  updateStructure = (structure) =>
    this.setState(({ structures, strctureKey }) => ({
      strctureKey: strctureKey + 1,
      structures: structures.map((a) => {
        if (a._id === structure._id) return structure;
        return a;
      }),
    }));
  render() {
    return (
      <StructuresContext.Provider
        value={{
          ...this.state,
          setStructures: this.setStructures,
          deleteStructure: this.deleteStructure,
          addStructure: this.addStructure,
          updateStructure: this.updateStructure,
        }}>
        {this.props.children}
      </StructuresContext.Provider>
    );
  }
}

export default StructuresContext;
