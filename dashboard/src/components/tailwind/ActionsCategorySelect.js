import { useState, useMemo, useEffect, useRef } from 'react';
import { selector, useRecoilValue } from 'recoil';
import { actionsCategoriesSelector, actionsState } from '../../recoil/actions';
import SortableJS from 'sortablejs';
import ModalContainer from './ModalContainer';

const categoriesSortedByMostUsedSelector = selector({
  key: 'categoriesSortedByMostUsedSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const categories = {};
    for (const action of actions) {
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

const ActionsCategorySelect = ({ label, values, onChange, id, withMostUsed }) => {
  const [open, setOpen] = useState(false);
  const [modalIsOpened, setModalIsOpened] = useState(false);
  const allGroups = useRecoilValue(actionsCategoriesSelector);
  const categoriesSortedByMostUsed = useRecoilValue(categoriesSortedByMostUsedSelector);
  const [selected, setSelected] = useState(() => values || []);
  const [search, setSearch] = useState('');
  const [groupSelected, setGroupSelected] = useState(allGroups[0].groupTitle);

  const mostUsedCategoriesToShow = useMemo(
    () => categoriesSortedByMostUsed.filter((category) => !selected.some((_category) => _category === category)).slice(0, 5),
    [categoriesSortedByMostUsed, selected]
  );

  const groups = useMemo(() => {
    if (!search && !selected.length) return allGroups;
    return allGroups.map(({ groupTitle, categories }) => {
      if (search) {
        categories = categories.filter((_category) => _category.toLowerCase().trim().includes(search.toLowerCase().trim()));
      }
      if (selected.length) {
        categories = categories.filter((_category) => !selected.includes(_category));
      }
      return { groupTitle, categories };
    });
  }, [search, selected, allGroups]);

  useEffect(() => {
    onChange(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const categories1Ref = useRef(null);
  const categories2Ref = useRef(null);
  const sortable1Ref = useRef(null);
  const sortable2Ref = useRef(null);
  const onDragAndDrop = (ref, from) => () => {
    if (!ref.current) return;
    const categoriesElement = ref.current.querySelectorAll('[data-category]');
    setSelected([...categoriesElement].map((el) => el.dataset.category));
  };
  useEffect(() => {
    sortable1Ref.current = SortableJS.create(categories1Ref.current, {
      animation: 150,
      group: 'categories-in-view',
      filter: '.not-draggable', // 'not-draggable' class is not draggable
      onEnd: onDragAndDrop(categories1Ref, '1'),
    });
  }, []);
  useEffect(() => {
    if (modalIsOpened) {
      sortable2Ref.current = SortableJS.create(categories2Ref.current, {
        animation: 150,
        group: 'categories-in-modal',
        onEnd: onDragAndDrop(categories2Ref, '2'),
      });
    } else {
      sortable2Ref.current?.destroy();
    }
  }, [modalIsOpened]);

  return (
    <>
      {!!label && (
        <label onClick={() => setOpen(true)} className="tw-block tw-text-gray-700">
          {label}
        </label>
      )}
      <div
        id={id}
        className="tw-flex tw-max-h-16 tw-flex-wrap tw-items-center tw-gap-2 tw-overflow-y-auto tw-rounded tw-border tw-border-gray-300 tw-px-2.5 tw-py-1"
        onClick={() => setOpen(true)}
        ref={categories1Ref}>
        {selected.map((category) => (
          <div key={category} data-category={category} className="selected-action-category tw-rounded tw-bg-gray-200 tw-px-2 tw-py-1 tw-text-sm">
            {category}
            <button
              className="selected-action-category-close-button tw-ml-2 tw-font-bold"
              onClick={(e) => {
                e.stopPropagation();
                setSelected((s) => s.filter((_cat) => _cat !== category));
              }}>
              &times;
            </button>
          </div>
        ))}
        {!selected.length && <div className="not-draggable tw-py-0.5 tw-opacity-60">-- Choisir --</div>}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="not-draggable add-action-category-button tw-relative tw-ml-auto tw-h-6 tw-w-6 tw-rounded-full tw-border tw-border-main">
          <div className="tw-absolute tw-inset-0 tw-m-auto tw-h-3/6 tw-w-0.5 tw-bg-main" />
          <div className="tw-absolute tw-inset-0 tw-m-auto tw-h-3/6 tw-w-0.5 tw-rotate-90 tw-bg-main" />
        </button>
      </div>
      {!!withMostUsed && (
        <div className="mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-1 tw-text-xs tw-text-gray-500">
          <p className="tw-m-0">Catégories les plus utilisées :</p>
          {mostUsedCategoriesToShow.map((cat) => (
            <button className="tw-rounded-full tw-border tw-border-gray-300 tw-p-1" key={cat} onClick={() => setSelected((s) => [...s, cat])}>
              {cat}
            </button>
          ))}
        </div>
      )}
      <ModalContainer
        open={open}
        setOpen={setOpen}
        onAfterEnter={() => setModalIsOpened(true)}
        onBeforeLeave={() => setModalIsOpened(false)}
        title="Sélectionner des catégories"
        Footer={() => (
          <button
            type="button"
            className="tw-mt-3 tw-inline-flex tw-w-full tw-justify-center tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-base tw-font-medium tw-text-gray-700 tw-shadow-sm hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-main focus:tw-ring-offset-2 sm:tw-mt-0 sm:tw-ml-3 sm:tw-w-auto sm:tw-text-sm"
            onClick={() => setOpen(false)}>
            Fermer
          </button>
        )}>
        <div
          className="tw-mx-4 tw-flex tw-max-h-16 tw-flex-wrap tw-gap-2 tw-overflow-y-auto tw-rounded tw-border tw-border-gray-300  tw-px-2.5 tw-py-1"
          ref={categories2Ref}>
          {selected.map((category) => (
            <div
              key={category}
              data-category={category}
              className="selected-action-category-modal tw-rounded tw-bg-gray-200 tw-px-2 tw-py-1 tw-text-sm">
              {category}
              <button
                className="selected-action-category-close-button-modal tw-ml-1 tw-font-bold"
                onClick={() => setSelected((s) => s.filter((_cat) => _cat !== category))}>
                &times;
              </button>
            </div>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            className="not-draggable form-text !tw-mt-0 tw-border-none tw-p-0 tw-px-2  tw-py-1 tw-text-sm placeholder:tw-italic"
            placeholder="Recherchez..."
          />
        </div>
        <div className="tw-mx-4 tw-mt-8 tw-flex tw-basis-full tw-overflow-hidden tw-rounded tw-border tw-border-gray-300">
          <div className="tw-flex tw-basis-1/3 tw-flex-col tw-justify-start tw-border-gray-300">
            <span className="tw-border-b tw-border-gray-300 tw-py-2 tw-px-4 tw-text-left tw-font-semibold">Groupes</span>
            <div className="tw-flex tw-flex-col tw-overflow-y-auto">
              {groups.map(({ groupTitle, categories }) => (
                <button
                  key={groupTitle}
                  type="button"
                  className={[
                    'action-category-group py-2 tw-border-b tw-border-gray-300 tw-px-4 tw-text-left',
                    groupSelected === groupTitle ? 'tw-bg-gray-200' : '',
                  ].join(' ')}
                  onClick={() => setGroupSelected(groupTitle)}>
                  {groupTitle} ({categories.length})
                </button>
              ))}
            </div>
          </div>
          <div className="tw-flex tw-h-[50vh] tw-basis-2/3 tw-flex-col tw-justify-start tw-border-l tw-border-gray-300">
            <span className="tw-border-b tw-border-gray-300 tw-py-2 tw-px-4 tw-text-left tw-font-semibold">Catégories</span>
            <div className="tw-flex tw-flex-col tw-overflow-y-auto">
              {groups
                .find((group) => group.groupTitle === groupSelected)
                ?.categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="action-category py-2 tw-border-b tw-border-gray-300 tw-px-4 tw-text-left"
                    onClick={() => {
                      setSearch('');
                      setSelected((c) => [...c, category]);
                    }}>
                    {category}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};

export default ActionsCategorySelect;
