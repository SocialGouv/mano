import { atom, useRecoilState } from 'recoil';

const structuresState = atom({
  key: 'structuresState',
  default: [],
});

const useStructures = () => {
  const [structures, setStructures] = useRecoilState(structuresState);

  const deleteStructure = (id) => setStructures((structures) => structures.filter((p) => p._id !== id));
  const addStructure = (structure) =>
    setStructures((structures) =>
      [...structures, structure].sort((s1, s2) => {
        if (s1.name < s2.name) return -1;
        if (s1.name > s2.name) return 1;
        return 0;
      })
    );

  return {
    structures,
    setStructures,
    deleteStructure,
    addStructure,
  };
};
export default useStructures;
