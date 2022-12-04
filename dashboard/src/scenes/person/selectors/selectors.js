import { selectorFamily } from 'recoil';
import { itemsGroupedByPersonSelector, personsObjectSelector } from '../../../recoil/selectors';

export const personSelector = selectorFamily({
  key: 'personSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const persons = get(personsObjectSelector);
      return persons[personId] || {};
    },
});

export const populatedPersonSelector = selectorFamily({
  key: 'populatedPersonSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const persons = get(itemsGroupedByPersonSelector);
      return persons[personId] || {};
    },
});

export const filteredPersonActionsSelector = selectorFamily({
  key: 'filteredPersonActionsSelector',
  get:
    ({ personId, filterCategories, filterStatus }) =>
    ({ get }) => {
      const person = get(populatedPersonSelector({ personId }));
      let actionsToSet = person?.actions || [];
      if (filterCategories.length) {
        actionsToSet = actionsToSet.filter((a) =>
          filterCategories.some((c) => (c === '-- Aucune --' ? a.categories?.length === 0 : a.categories?.includes(c)))
        );
      }
      if (filterStatus.length) {
        actionsToSet = actionsToSet.filter((a) => filterStatus.some((s) => a.status === s));
      }
      return [...actionsToSet]
        .sort((p1, p2) => ((p1.completedAt || p1.dueAt) > (p2.completedAt || p2.dueAt) ? -1 : 1))
        .map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca' } } : a));
    },
});
