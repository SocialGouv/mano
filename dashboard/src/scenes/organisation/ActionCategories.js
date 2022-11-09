import React, { useState, useEffect, useRef, useCallback } from 'react';
import { selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import SortableJS from 'sortablejs';
import { useDataLoader } from '../../components/DataLoader';
import ButtonCustom from '../../components/ButtonCustom';
import { actionsCategoriesSelector, flattenedCategoriesSelector, actionsState, prepareActionForEncryption } from '../../recoil/actions';
import { organisationState } from '../../recoil/auth';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../../services/api';
import ModalWithForm from '../../components/tailwind/ModalWithForm';
import Input from '../../components/tailwind/Input';
import { toast } from 'react-toastify';

const groupTitlesSelector = selector({
  key: 'groupTitlesSelector',
  get: ({ get }) => {
    const actionsGroupedCategories = get(actionsCategoriesSelector);
    return actionsGroupedCategories.map((group) => group.groupTitle);
  },
});

const ActionCategories = () => {
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
    const res = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { actionsGroupedCategories: groups },
    });
    if (res.ok) {
      setOrganisation(res.data);
      refresh();
    }
  }, [API, organisation._id, refresh, setOrganisation]);

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
        <div className="tw--m-1 tw-inline-flex tw-w-full tw-flex-wrap" ref={gridRef}>
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
            onClick: () => {
              setAddGroupModalVisible(false);
            },
          },
          {
            text: 'Annuler',
            type: 'cancel',
          },
        ]}>
        <form id="add-action-categories-group-form" className="tw-flex tw-flex-col tw-gap-4" onSubmit={onAddGroup}>
          <Input label="Titre du groupe" id="groupTitle" name="groupTitle" type="text" placeholder="Démarches administratives" />
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

  const API = useApi();
  const { refresh } = useDataLoader();
  const setOrganisation = useSetRecoilState(organisationState);

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
      if (group.groupTitle === groupTitle) {
        return {
          ...group,
          groupTitle: newGroupTitle,
        };
      }
      return group;
    });

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
      toast.error("Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !");
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
    }
  };

  return (
    <>
      <div className="tw-basis-1/3 tw-p-1">
        <details open key={groupTitle} data-group={groupTitle} className="tw-flex tw-flex-col tw-rounded-2xl tw-bg-main tw-bg-opacity-10 tw-p-4">
          <summary className="tw-basis-full tw-text-sm tw-font-bold tw-tracking-wide tw-text-gray-700">
            <div className="tw-group tw-inline-flex tw-w-11/12 tw-shrink tw-justify-between">
              <span className="tw-pl-2">
                {groupTitle} ({categories.length})
              </span>
              <button type="button" className="tw-ml-auto tw-hidden group-hover:tw-inline-flex" onClick={() => setIsEditingGroupTitle(true)}>
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
          <Input label="Nouveau nom du groupe" id="newGroupTitle" name="newGroupTitle" type="text" placeholder={groupTitle} />
        </form>
      </ModalWithForm>
    </>
  );
};

const Category = ({ category, groupTitle }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const actions = useRecoilValue(actionsState);
  const setOrganisation = useSetRecoilState(organisationState);

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
      if (group.groupTitle === groupTitle) {
        return {
          ...group,
          categories: [...new Set((group.categories || []).map((cat) => (cat === oldCategory ? newCategory.trim() : cat)))],
        };
      }
      return group;
    });

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
    }
  };

  const onDeleteCategory = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette opération est irréversible')) return;
    const newActionsGroupedCategories = actionsGroupedCategories.map((group) => {
      if (group.groupTitle === groupTitle) {
        return {
          ...group,
          categories: group.categories.filter((cat) => cat !== category),
        };
      }
      return group;
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
        <p className="tw-m-0">{category}</p>
        <button type="button" className="tw-ml-auto tw-hidden group-hover:tw-inline-flex" onClick={() => setIsEditingCategory(true)}>
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
          <Input label="Nouveau nom de la catégorie" id="newCategory" name="newCategory" type="text" placeholder={category} />
        </form>
      </ModalWithForm>
    </>
  );
};

export default ActionCategories;
