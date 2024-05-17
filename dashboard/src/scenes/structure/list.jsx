import React, { useEffect, useMemo, useState } from "react";
import { SmallHeader } from "../../components/header";
import Loading from "../../components/loading";
import Table from "../../components/table";
import { toast } from "react-toastify";
import ButtonCustom from "../../components/ButtonCustom";
import Search from "../../components/search";
import API from "../../services/api";
import { formatDateWithFullMonth } from "../../services/date";
import useTitle from "../../services/useTitle";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import SelectCustom from "../../components/SelectCustom";
import { useRecoilValue } from "recoil";
import { userState } from "../../recoil/auth";
import { flattenedStructuresCategoriesSelector } from "../../recoil/structures";
import { filterBySearch } from "../search/utils";

const List = () => {
  const [structures, setStructures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [currentStructure, setCurrentStructure] = useState(null);
  const [currentStructureOpen, setCurrentStructureOpen] = useState(false);

  const filteredStructures = useMemo(() => {
    return filterBySearch(search, structures);
  }, [search, structures]);

  useTitle("Structures");

  const getStructures = async () => {
    const response = await API.get({ path: "/structure" });
    if (response.ok) {
      setStructures(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getStructures();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <>
      <SmallHeader title={`Structures (${filteredStructures?.length})`} />
      <div className="tw-mb-5 tw-flex tw-flex-row tw-justify-center">
        <div className="noprint tw-flex tw-w-full tw-justify-end tw-gap-3">
          <Structure
            key={currentStructure}
            onSuccess={() => {
              setCurrentStructure(null);
              getStructures();
            }}
            structure={currentStructure}
            open={currentStructureOpen}
            onOpen={() => setCurrentStructureOpen(true)}
            onClose={() => {
              setCurrentStructure(null);
              setCurrentStructureOpen(false);
            }}
          />
        </div>
      </div>
      <div className="tw-mb-10 tw-flex tw-flex-wrap tw-border-b tw-border-gray-200">
        <div className="tw-mb-5 tw-flex tw-w-full tw-items-center tw-px-2">
          <label htmlFor="search" className="tw-mr-5 tw-w-40 tw-shrink-0">
            Recherche&nbsp;:
          </label>
          <Search placeholder="Nom, catégorie, ville, etc." value={search} onChange={setSearch} />
        </div>
      </div>
      <Table
        data={filteredStructures}
        rowKey={"_id"}
        onRowClick={(s) => {
          setCurrentStructure(s);
          setCurrentStructureOpen(true);
        }}
        columns={[
          {
            title: "Nom",
            dataKey: "name",
            render: (structure) => {
              return (
                <div className="[overflow-wrap:anywhere] tw-min-w-32">
                  <b>{structure.name}</b>
                </div>
              );
            },
          },
          {
            title: "Description",
            dataKey: "description",
            render: (structure) => <div className="[overflow-wrap:anywhere] tw-text-xs">{structure.description}</div>,
          },
          { title: "Téléphone", dataKey: "phone" },
          {
            title: "Adresse",
            dataKey: "adresse",
            render: (structure) => {
              return (
                <>
                  <div className="[overflow-wrap:anywhere]">{structure.adresse}</div>
                  {structure.postcode ? <div>{structure.postcode}</div> : null}
                  {structure.city ? <div>{structure.city}</div> : null}
                </>
              );
            },
          },
          {
            title: "Catégories",
            dataKey: "categories",
            render: (structure) => {
              return (
                <>
                  {structure.categories?.map((category) => (
                    <span
                      className="tw-whitespace-no-wrap tw-mx-0.5 tw-my-0 tw-inline-block tw-rounded tw-bg-main75 tw-px-1 tw-py-0.5 tw-text-center tw-align-baseline tw-text-[10.5px] tw-font-bold tw-leading-none tw-text-white"
                      color="info"
                      key={category}
                      data-test-id={structure.name + category}
                    >
                      {category}
                    </span>
                  ))}
                </>
              );
            },
          },
          { title: "Créée le", dataKey: "createdAt", render: (i) => formatDateWithFullMonth(i.createdAt) },
        ]}
      />
    </>
  );
};

const Structure = ({ structure: initStructure, onSuccess, open, onClose, onOpen }) => {
  const structureRef = React.useRef(initStructure);
  const user = useRecoilValue(userState);
  const categories = useRecoilValue(flattenedStructuresCategoriesSelector);

  const [structure, setStructure] = useState(initStructure);
  const [disabled, setDisabled] = useState(false);
  const onResetAndClose = () => {
    structureRef.current = initStructure;
    setStructure(initStructure);
    onClose();
  };

  const onChange = (e) => setStructure({ ...structure, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    setDisabled(true);
    try {
      if (!structure.name) throw new Error("Le nom de la structure est obligatoire");
      const isNew = !initStructure?._id;
      const res = !isNew
        ? await API.put({ path: `/structure/${initStructure._id}`, body: structure })
        : await API.post({ path: "/structure", body: structure });
      setDisabled(false);
      if (!res.ok) return;
      toast.success(!isNew ? "Structure mise à jour !" : "Structure créée !");
      onSuccess();
      onResetAndClose();
    } catch (errorCreatingStructure) {
      toast.error(errorCreatingStructure.message);
    }
    setDisabled(false);
  };

  const onDeleteStructure = async () => {
    if (window.confirm("Voulez-vous vraiment supprimer cette structure ? Cette action est irréversible.")) {
      const res = await API.delete({ path: `/structure/${structure._id}` });
      if (!res.ok) return;
      toast.success("Structure supprimée !");
      onSuccess();
      onResetAndClose();
    }
  };

  return (
    <div className="tw-flex tw-w-full tw-justify-end">
      <ButtonCustom onClick={onOpen} color="primary" title="Créer une nouvelle structure" padding="12px 24px" />
      <ModalContainer open={open} onClose={onResetAndClose} size="full">
        <ModalHeader title={!initStructure?._id ? "Créer une structure" : "Modifier une structure"} />
        <ModalBody className="tw-pb-4">
          <form id="create-structure-form" className="tw-flex tw-w-full tw-flex-row tw-flex-wrap" onSubmit={onSubmit}>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className="tailwindui" htmlFor="name">
                Nom
              </label>
              <input type="text" className="tailwindui" name="name" id="name" value={structure?.name || ""} onChange={onChange} />
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className="tailwindui" htmlFor="phone">
                Téléphone
              </label>
              <input type="text" className="tailwindui" name="phone" id="phone" value={structure?.phone || ""} onChange={onChange} />
            </div>
            <div className="tw-flex tw-basis-full tw-flex-col tw-px-4 tw-py-2">
              <label className="tailwindui" htmlFor="adresse">
                Adresse (numéro et rue)
              </label>
              <textarea type="text" className="tailwindui" name="adresse" id="adresse" value={structure?.adresse || ""} onChange={onChange} />
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className="tailwindui" htmlFor="postcode">
                Code postal
              </label>
              <input type="text" className="tailwindui" name="postcode" id="postcode" value={structure?.postcode || ""} onChange={onChange} />
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className="tailwindui" htmlFor="city">
                Ville
              </label>
              <input type="text" className="tailwindui" name="city" id="city" value={structure?.city || ""} onChange={onChange} />
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className="tailwindui" htmlFor="description">
                Description
              </label>
              <textarea className="tailwindui" name="description" id="description" value={structure?.description || ""} onChange={onChange} />
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <label className="tailwindui" htmlFor="description">
                Catégorie(s)
              </label>
              <SelectCustom
                inputId="categories"
                name="categories"
                classNamePrefix="categories"
                isMulti
                options={categories.map((opt) => ({ value: opt, label: opt }))}
                value={(structure?.categories || []).map((opt) => ({ value: opt, label: opt }))}
                onChange={(v) => {
                  onChange({ target: { name: "categories", value: v.map((v) => v.value) } });
                }}
              />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
            Annuler
          </button>
          {user.role === "admin" && Boolean(initStructure?._id) && (
            <button type="button" className="button-destructive" onClick={onDeleteStructure}>
              Supprimer
            </button>
          )}
          <button
            type="submit"
            disabled={disabled || JSON.stringify(structureRef.current) === JSON.stringify(structure)}
            className="button-submit"
            form="create-structure-form"
          >
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </div>
  );
};

export default List;
