import { useState, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useDataLoader } from "../../components/DataLoader";
import { actionsCategoriesSelector, flattenedActionsCategoriesSelector, actionsState, encryptAction } from "../../recoil/actions";
import { organisationState, userState } from "../../recoil/auth";
import API, { tryFetchExpectOk } from "../../services/api";
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import { toast } from "react-toastify";
import DragAndDropSettings from "./DragAndDropSettings";

const ActionCategoriesSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const actionsGroupedCategories = useRecoilValue(actionsCategoriesSelector);
  const dataFormatted = useMemo(() => {
    return actionsGroupedCategories.map(({ groupTitle, categories }) => ({
      groupTitle,
      items: categories,
    }));
  }, [actionsGroupedCategories]);

  const { refresh } = useDataLoader();

  const onAddGroup = async (groupTitle) => {
    const [error, res] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: { actionsGroupedCategories: [...actionsGroupedCategories, { groupTitle, categories: [] }] },
      })
    );
    if (!error) {
      toast.success("Groupe ajouté", { autoclose: 2000 });
      setOrganisation(res.data);
    }
    refresh();
  };

  const onGroupTitleChange = async (oldGroupTitle, newGroupTitle) => {
    const newActionsGroupedCategories = actionsGroupedCategories.map((group) => {
      if (group.groupTitle !== oldGroupTitle) return group;
      return {
        ...group,
        groupTitle: newGroupTitle,
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI

    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/category`,
        body: {
          actionsGroupedCategories: newActionsGroupedCategories,
        },
      })
    );
    if (!error) {
      refresh();
      setOrganisation(response.data);
      toast.success("Groupe mis à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteGroup = async (groupTitle) => {
    const newActionsGroupedCategories = actionsGroupedCategories.filter((group) => group.groupTitle !== groupTitle);

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI

    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/category`,
        body: {
          actionsGroupedCategories: newActionsGroupedCategories,
        },
      })
    );
    if (!error) {
      refresh();
      setOrganisation(response.data);
      toast.success("Catégorie supprimée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDragAndDrop = useCallback(
    async (newGroups) => {
      newGroups = newGroups.map((group) => ({ groupTitle: group.groupTitle, categories: group.items }));
      const [error, res] = await tryFetchExpectOk(async () =>
        API.put({
          path: `/organisation/${organisation._id}`,
          body: { actionsGroupedCategories: newGroups },
        })
      );
      if (!error) {
        setOrganisation(res.data);
        refresh();
      }
    },
    [organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title={<h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Catégories d'action</h3>}
      data={dataFormatted}
      addButtonCaption="Ajouter un groupe"
      onAddGroup={onAddGroup}
      onGroupTitleChange={onGroupTitleChange}
      dataItemKey={(cat) => cat}
      ItemComponent={Category}
      NewItemComponent={AddCategory}
      onDeleteGroup={onDeleteGroup}
      onDragAndDrop={onDragAndDrop}
    />
  );
};

const AddCategory = ({ groupTitle }) => {
  const actionsGroupedCategories = useRecoilValue(actionsCategoriesSelector);
  const flattenedCategories = useRecoilValue(flattenedActionsCategoriesSelector);

  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const onAddCategory = async (e) => {
    e.preventDefault();
    const { newCategory } = Object.fromEntries(new FormData(e.target));
    if (!newCategory) return toast.error("Vous devez saisir un nom pour la catégorie");
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
    const [error, res] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/category`,
        body: {
          actionsGroupedCategories: newActionsGroupedCategories,
        },
      })
    );
    if (!error) {
      setOrganisation(res.data);
      toast.success("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <form className="tw-mt-4 tw-flex tw-break-normal" onSubmit={onAddCategory}>
      <input
        type="text"
        id="newCategory"
        name="newCategory"
        className="form-text tw-my-1  tw-w-full tw-rounded tw-bg-white/50 tw-px-1.5 tw-py-1 placeholder:tw-opacity-80"
        placeholder="Ajouter une catégorie"
      />
      <button type="submit" className="tw-ml-4 tw-rounded tw-bg-transparent hover:tw-underline">
        Ajouter
      </button>
    </form>
  );
};

const Category = ({ item: category, groupTitle }) => {
  const [isSelected, setIsSelected] = useState(false);
  const user = useRecoilValue(userState);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const actions = useRecoilValue(actionsState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const actionsGroupedCategories = useRecoilValue(actionsCategoriesSelector);
  const flattenedCategories = useRecoilValue(flattenedActionsCategoriesSelector);
  const { refresh } = useDataLoader();

  const onEditCategory = async (e) => {
    e.preventDefault();
    const { newCategory } = Object.fromEntries(new FormData(e.target));
    const oldCategory = category;
    if (!newCategory) return toast.error("Vous devez saisir un nom pour la catégorie");
    if (newCategory.trim() === oldCategory.trim()) return toast.error("Le nom de la catégorie n'a pas changé");
    if (flattenedCategories.includes(newCategory)) {
      const existingGroupTitle = actionsGroupedCategories.find(({ categories }) => categories.includes(newCategory)).groupTitle;
      return toast.error(`Cette catégorie existe déjà: ${existingGroupTitle} > ${newCategory}`);
    }
    const encryptedActions = await Promise.all(
      actions
        .filter((a) => a.categories?.includes(oldCategory))
        .map((action) => ({
          ...action,
          categories: [...new Set(action.categories.map((cat) => (cat === oldCategory ? newCategory.trim() : cat)))],
        }))
        .map((action) => encryptAction({ ...action, user: action.user || user._id }))
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

    const [error, res] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/category`,
        body: {
          actionsGroupedCategories: newActionsGroupedCategories,
          actions: encryptedActions,
        },
      })
    );
    if (!error) {
      refresh();
      setOrganisation(res.data);
      setIsEditingCategory(false);
      toast.success("Catégorie mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteCategory = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette catégorie ? Cette opération est irréversible")) return;
    const newActionsGroupedCategories = actionsGroupedCategories.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        categories: group.categories.filter((cat) => cat !== category),
      };
    });
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, actionsGroupedCategories: newActionsGroupedCategories }); // optimistic UI

    const [error, res] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/category`,
        body: {
          actionsGroupedCategories: newActionsGroupedCategories,
        },
      })
    );
    if (!error) {
      refresh();
      setIsEditingCategory(false);
      setOrganisation(res.data);
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
          "tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1",
          isSelected ? "tw-rounded tw-border-main" : "",
        ].join(" ")}
      >
        <p className="tw-m-0" id={category}>
          {category}
        </p>
        <button
          type="button"
          aria-label={`Modifier la catégorie ${category}`}
          className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
          onClick={() => setIsEditingCategory(true)}
        >
          ✏️
        </button>
      </div>
      <ModalContainer open={isEditingCategory}>
        <ModalHeader title={`Éditer la catégorie: ${category}`} />
        <ModalBody className="tw-py-4">
          <form id="edit-category-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditCategory}>
            <div>
              <label htmlFor="newCategory" className="tailwindui">
                Nouveau nom de la catégorie
              </label>
              <input className="tailwindui" autoComplete="off" id="newCategory" name="newCategory" type="text" placeholder={category} />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setIsEditingCategory(false)}>
            Annuler
          </button>
          <button type="button" className="button-destructive" onClick={onDeleteCategory}>
            Supprimer
          </button>
          <button type="submit" className="button-submit" form="edit-category-form">
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

export default ActionCategoriesSettings;
