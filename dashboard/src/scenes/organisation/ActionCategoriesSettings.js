import React, { useState, useEffect, useRef, useCallback } from 'react';
import { selector, useRecoilState, useRecoilValue } from 'recoil';
import SortableJS from 'sortablejs';
import { useDataLoader } from '../../components/DataLoader';
import ButtonCustom from '../../components/ButtonCustom';
import { actionsCategoriesSelector, flattenedCategoriesSelector, actionsState, prepareActionForEncryption } from '../../recoil/actions';
import { organisationState } from '../../recoil/auth';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../../services/api';
import ModalWithForm from '../../components/tailwind/ModalWithForm';
import { toast } from 'react-toastify';
import { capture } from '../../services/sentry';

const groupTitlesSelector = selector({
  key: 'groupTitlesSelector',
  get: ({ get }) => {
    const actionsGroupedCategories = get(actionsCategoriesSelector);
    return actionsGroupedCategories.map((group) => group.groupTitle);
  },
});

const ActionCategoriesSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const actionsGroupedCategories = useRecoilValue(actionsCategoriesSelector);
  const [addGroupModalVisible, setAddGroupModalVisible] = useState(false);

  const { refresh } = useDataLoader();
  const API = useApi();

  const onAddGroup = async (e) => {
    e.preventDefault();
    const { groupTitle } = Object.fromEntries(new FormData(e.target));
    if (!groupTitle) return toast.error("Le titre du groupe d'actions est obligatoire");
    if (actionsGroupedCategories.find((group) => group.groupTitle === groupTitle)) return toast.error('Ce groupe existe déjà');
    const res = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { actionsGroupedCategories: [...actionsGroupedCategories, { groupTitle, categories: [] }] },
    });
    if (res.ok) {
      toast.success('Groupe ajouté', { autoclose: 2000 });
      setOrganisation(res.data);
      setAddGroupModalVisible(false);
      refresh();
    }
    refresh();
  };

  const onDragAndDrop = useCallback(async () => {
    const groupsElements = gridRef.current.querySelectorAll('[data-group]');
    const groups = [...groupsElements].map((group) => group.dataset.group).map((groupTitle) => ({ groupTitle, categories: [] }));
    for (const group of groups) {
      const categoriesElements = gridRef.current.querySelectorAll(`[data-group="${group.groupTitle}"] [data-category]`);
      group.categories = [...categoriesElements].map((category) => category.dataset.category);
    }
    /* there is a bug sometimes with the drag and drop, where some categories are duplicated or even groups disappear...
      we need to check that drag-n-drop only drag-n-dropped and didn't add/remove anything
    */
    if (groups.length !== actionsGroupedCategories.length) {
      capture('Drag and drop group error', { extra: { groups, actionsGroupedCategories } });
      return toast.error('Désolé, une erreur est survenue lors du glisser/déposer', "L'équipe technique a été prévenue. Vous pouvez réessayer");
    }
    if (
      groups.reduce((cats, group) => [...cats, ...group.categories], []).length !==
      actionsGroupedCategories.reduce((cats, group) => [...cats, ...group.categories], []).length
    ) {
      capture('Drag and drop categories error', { extra: { groups, actionsGroupedCategories } });
      return toast.error('Désolé, une erreur est survenue lors du glisser/déposer', "L'équipe technique a été prévenue. Vous pouvez réessayer");
    }
    const res = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { actionsGroupedCategories: groups },
    });
    if (res.ok) {
      setOrganisation(res.data);
      refresh();
    }
  }, [API, actionsGroupedCategories, organisation._id, refresh, setOrganisation]);

  const gridRef = useRef(null);
  const sortableRef = useRef(null);
  useEffect(() => {
    sortableRef.current = SortableJS.create(gridRef.current, {
      animation: 150,
      group: 'categoriesGroups',
      onEnd: onDragAndDrop,
    });
  }, [actionsGroupedCategories, onDragAndDrop]);

  return (
    <>
      <div className="tw-my-10 tw-flex tw-items-center tw-gap-2">
        <h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Catégories d'action</h3>
        <ButtonCustom title="Ajouter un groupe" className="tw-ml-auto" onClick={() => setAddGroupModalVisible(true)} />
      </div>
      <hr />
      <div key={JSON.stringify(actionsGroupedCategories)}>
        <div id="category-groups" className="tw--m-1 tw-inline-flex tw-w-full tw-flex-wrap" ref={gridRef}>
          {actionsGroupedCategories.map(({ groupTitle, categories }) => (
            <ActionCategoriesGroup key={groupTitle} groupTitle={groupTitle} categories={categories} onDragAndDrop={onDragAndDrop} />
          ))}
        </div>
      </div>
      <ModalWithForm
        open={addGroupModalVisible}
        setOpen={setAddGroupModalVisible}
        title="Ajouter un groupe de catégories"
        buttons={[
          {
            text: 'Ajouter',
            type: 'submit',
            form: 'add-action-categories-group-form',
          },
          {
            text: 'Annuler',
            type: 'cancel',
          },
        ]}>
        <form id="add-action-categories-group-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4" onSubmit={onAddGroup}>
          <div>
            <label htmlFor="groupTitle" className="form-text tailwindui">
              Titre du groupe
            </label>
            <input type="text" id="groupTitle" name="groupTitle" placeholder="Démarches administratives" className="form-text tailwindui" />
          </div>
        </form>
      </ModalWithForm>
    </>
  );
};

const ActionCategoriesGroup = ({ groupTitle, categories, onDragAndDrop }) => {
  const listRef = useRef(null);
  const sortableRef = useRef(null);
  const [isEditingGroupTitle, setIsEditingGroupTitle] = useState(false);
  const groupTitles = useRecoilValue(groupTitlesSelector);
  const actionsGroupedCategories = useRecoilValue(actionsCategoriesSelector);
  const actions = useRecoilValue(actionsState);
  const flattenedCategories = useRecoilValue(flattenedCategoriesSelector);

  const API = useApi();
  const { refresh } = useDataLoader();
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  useEffect(() => {
    sortableRef.current = SortableJS.create(listRef.current, {
      animation: 150,
      group: 'categories',
      onEnd: onDragAndDrop,
    });
  }, [onDragAndDrop]);

  const onEditGroupTitle = async (e) => {
    e.preventDefault();
    const { newGroupTitle } = Object.fromEntries(new FormData(e.target));
    const oldGroupTitle = groupTitle;
    if (!newGroupTitle) return toast.error('Vous devez saisir un nom pour le groupe');
    if (newGroupTitle.trim() === oldGroupTitle.trim()) return toast.error("Le nom du groupe n'a pas changé");
    if (groupTitles.find((title) => title === newGroupTitle)) return toast.error('Ce groupe existe déjà');

    const newActionsGroupedCategories = actionsGroupedCategories.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        groupTitle: newGroupTitle,
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI

    const response = await API.put({
      path: `/category`,
      body: {
        actionsGroupedCategories: newActionsGroupedCategories,
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      setIsEditingGroupTitle(false);
      toast.success("Groupe mis à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteGroup = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe et toutes ses catégories ? Cette opération est irréversible')) return;
    const newActionsGroupedCategories = actionsGroupedCategories.filter((group) => group.groupTitle !== groupTitle);
    const categoriesToDelete = actionsGroupedCategories.find((group) => group.groupTitle === groupTitle).categories;
    const encryptedActions = await Promise.all(
      actions
        .map((a) => {
          for (const category of a.categories || []) {
            if (categoriesToDelete.includes(category)) {
              return a;
            }
          }
          return null;
        })
        .filter(Boolean)
        .map((action) => ({
          ...action,
          categories: (action.categories || []).map((category) => (categoriesToDelete.includes(category) ? null : category)).filter(Boolean),
        }))
        .map(prepareActionForEncryption)
        .map(encryptItem(hashedOrgEncryptionKey))
    );

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI

    const response = await API.put({
      path: `/category`,
      body: {
        actionsGroupedCategories: newActionsGroupedCategories,
        actions: encryptedActions,
      },
    });
    if (response.ok) {
      refresh();
      setIsEditingGroupTitle(false);
      setOrganisation(response.data);
      toast.success("Catégorie supprimée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onAddCategory = async (e) => {
    e.preventDefault();
    const { newCategory } = Object.fromEntries(new FormData(e.target));
    if (!newCategory) return toast.error('Vous devez saisir un nom pour la catégorie');
    if (flattenedCategories.includes(newCategory)) {
      const existingGroupTitle = actionsGroupedCategories.find(({ categories }) => categories.includes(newCategory)).groupTitle;
      return toast.error(`Cette catégorie existe déjà: ${existingGroupTitle} > ${newCategory}`);
    }
    const newActionsGroupedCategories = actionsGroupedCategories.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        categories: [...new Set([...(group.categories || []), newCategory])],
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI
    const response = await API.put({
      path: `/category`,
      body: {
        actionsGroupedCategories: newActionsGroupedCategories,
      },
    });
    if (response.ok) {
      setOrganisation(response.data);
      toast.success("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard", { autoClose: 2000 });
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <>
      <div className="tw-basis-1/3 tw-p-1">
        <details
          open
          key={groupTitle}
          id={groupTitle}
          data-group={groupTitle}
          className="category-group tw-flex tw-flex-col tw-rounded-2xl tw-bg-main tw-bg-opacity-10 tw-p-4">
          <summary className="tw-basis-full tw-text-sm tw-font-bold tw-tracking-wide tw-text-gray-700">
            <div className="tw-group tw-inline-flex tw-w-11/12 tw-shrink tw-justify-between">
              <span className="category-group-title tw-pl-2">
                {groupTitle} ({categories.length})
              </span>
              <button
                type="button"
                aria-label={`Modifier le groupe ${groupTitle}`}
                className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
                onClick={() => setIsEditingGroupTitle(true)}>
                ✏️
              </button>
            </div>
          </summary>
          <div className="tw-mt-4 tw-flex tw-flex-col" ref={listRef}>
            {!categories.length ? (
              <p className="tw-m-0 tw-text-xs tw-italic tw-opacity-30">Aucune catégorie dans ce groupe</p>
            ) : (
              categories.map((category) => <Category category={category} key={category} groupTitle={groupTitle} />)
            )}
            <form className="tw-flex" onSubmit={onAddCategory}>
              <input
                type="text"
                id="newCategory"
                name="newCategory"
                className="form-text tw-my-1 tw-rounded tw-bg-transparent tw-px-1.5 tw-py-1 placeholder:tw-opacity-60"
                placeholder="Ajouter une catégorie"
              />
              <button type="submit" className="tw-ml-auto tw-rounded tw-bg-transparent">
                Ajouter
              </button>
            </form>
          </div>
        </details>
      </div>
      <ModalWithForm
        open={isEditingGroupTitle}
        setOpen={setIsEditingGroupTitle}
        title={`Éditer le groupe: ${groupTitle}`}
        buttons={[
          {
            text: 'Enregistrer',
            type: 'submit',
            form: 'edit-category-group-form',
          },
          {
            text: 'Supprimer',
            type: 'destructive',
            onClick: onDeleteGroup,
          },
          {
            text: 'Annuler',
            type: 'cancel',
          },
        ]}>
        <form id="edit-category-group-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4" onSubmit={onEditGroupTitle}>
          <div>
            <label htmlFor="newGroupTitle" className="form-text tailwindui">
              Nouveau nom du groupe
            </label>
            <input type="text" id="newGroupTitle" name="newGroupTitle" placeholder={groupTitle} className="form-text tailwindui" />
          </div>
        </form>
      </ModalWithForm>
    </>
  );
};

const Category = ({ category, groupTitle }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const actions = useRecoilValue(actionsState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const API = useApi();
  const actionsGroupedCategories = useRecoilValue(actionsCategoriesSelector);
  const flattenedCategories = useRecoilValue(flattenedCategoriesSelector);
  const { refresh } = useDataLoader();

  const onEditCategory = async (e) => {
    e.preventDefault();
    const { newCategory } = Object.fromEntries(new FormData(e.target));
    const oldCategory = category;
    if (!newCategory) return toast.error('Vous devez saisir un nom pour la catégorie');
    if (newCategory.trim() === oldCategory.trim()) return toast.error("Le nom de la catégorie n'a pas changé");
    if (flattenedCategories.includes(newCategory)) {
      const existingGroupTitle = actionsGroupedCategories.find(({ categories }) => categories.includes(newCategory)).groupTitle;
      return toast.error(`Cette catégorie existe déjà: ${existingGroupTitle} > ${newCategory}`);
    }
    const encryptedActions = await Promise.all(
      actions
        .filter((a) => a.categories.includes(oldCategory))
        .map((action) => ({
          ...action,
          categories: [...new Set(action.categories.map((cat) => (cat === oldCategory ? newCategory.trim() : cat)))],
        }))
        .map(prepareActionForEncryption)
        .map(encryptItem(hashedOrgEncryptionKey))
    );
    const newActionsGroupedCategories = actionsGroupedCategories.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        categories: [...new Set((group.categories || []).map((cat) => (cat === oldCategory ? newCategory.trim() : cat)))],
      };
    });
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI

    const response = await API.put({
      path: `/category`,
      body: {
        actionsGroupedCategories: newActionsGroupedCategories,
        actions: encryptedActions,
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      setIsEditingCategory(false);
      toast.success("Catégorie mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteCategory = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette opération est irréversible')) return;
    const newActionsGroupedCategories = actionsGroupedCategories.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        categories: group.categories.filter((cat) => cat !== category),
      };
    });
    const encryptedActions = await Promise.all(
      actions
        .filter((a) => a.categories.includes(category))
        .map((action) => ({
          ...action,
          categories: action.categories.filter((cat) => cat !== category),
        }))
        .map(prepareActionForEncryption)
        .map(encryptItem(hashedOrgEncryptionKey))
    );
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI

    const response = await API.put({
      path: `/category`,
      body: {
        actionsGroupedCategories: newActionsGroupedCategories,
        actions: encryptedActions,
      },
    });
    if (response.ok) {
      refresh();
      setIsEditingCategory(false);
      setOrganisation(response.data);
      toast.success("Catégorie supprimée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <>
      <div
        key={category}
        data-category={category}
        onMouseDown={() => setIsSelected(true)}
        onMouseUp={() => setIsSelected(false)}
        className={[
          'tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1',
          isSelected ? 'tw-rounded tw-border-main' : '',
        ].join(' ')}>
        <p className="tw-m-0" id={category}>
          {category}
        </p>
        <button
          type="button"
          aria-label={`Modifier la catégorie ${category}`}
          className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
          onClick={() => setIsEditingCategory(true)}>
          ✏️
        </button>
      </div>
      <ModalWithForm
        open={isEditingCategory}
        setOpen={setIsEditingCategory}
        title={`Éditer la catégorie: ${category}`}
        buttons={[
          {
            text: 'Enregistrer',
            type: 'submit',
            form: 'edit-category-group-form',
          },
          {
            text: 'Supprimer',
            type: 'destructive',
            onClick: onDeleteCategory,
          },
          {
            text: 'Annuler',
            type: 'cancel',
          },
        ]}>
        <form id="edit-category-group-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4" onSubmit={onEditCategory}>
          <div>
            <label htmlFor="newCategory" className="form-text tailwindui">
              Nouveau nom de la catégorie
            </label>
            <input className="form-text tailwindui" id="newCategory" name="newCategory" type="text" placeholder={category} />
          </div>
        </form>
      </ModalWithForm>
    </>
  );
};

export default ActionCategoriesSettings;
