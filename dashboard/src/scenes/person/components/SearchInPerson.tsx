import React, { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import TabsNav from "../../../components/tailwind/TabsNav";
import type { PersonPopulated } from "../../../types/person";
import Search from "../../../components/search";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../../components/tailwind/Modal";
import Table from "../../../components/table";
import { userState } from "../../../recoil/auth";
import { formatDateWithFullMonth } from "../../../services/date";
import { useLocalStorage } from "../../../services/useLocalStorage";
import { filterBySearch } from "../../search/utils";
import TreatmentsSortableList from "./TreatmentsSortableList";
import ActionsSortableList from "../../../components/ActionsSortableList";
import CommentsSortableList from "../../../components/CommentsSortableList";
import { DocumentsModule, DocumentTable } from "../../../components/DocumentsGeneric";

export default function SearchInPerson({ person }: { person: PersonPopulated }) {
  const [search, setSearch] = useLocalStorage("person-search", "");
  const [syncSearchInputsKey, setSyncSearchInputsKey] = useState(0);

  const open = search.length > 0;
  function onClose() {
    setSearch("");
    setSyncSearchInputsKey((prev) => prev + 1);
  }

  return (
    <>
      <Search placeholder={`Rechercher dans le dossier de ${person.name}...`} value={search} onChange={setSearch} key={syncSearchInputsKey} />
      <ModalContainer open={open} onClose={onClose} size="full">
        <ModalHeader title={`Résultats de la recherche dans le dossier de ${person.name}`} onClose={onClose} />
        <ModalBody className="tw-min-h-1/2">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center">
            <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center [&>div]:tw-max-w-96">
              <Search placeholder={`Rechercher dans le dossier de ${person.name}...`} value={search} onChange={setSearch} key={syncSearchInputsKey} />
            </div>
            <SearchResults person={person} search={search} />
          </div>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
}

function SearchResults({ person, search }: { person: PersonPopulated; search: string }) {
  const user = useRecoilValue(userState);
  const initTabs = useMemo(() => {
    const defaultTabs = ["Actions", "Commentaires non médicaux", "Lieux", "Documents non médicaux"];
    if (!user.healthcareProfessional) return defaultTabs;
    return [...defaultTabs, "Consultations", "Traitements", "Dossiers médicaux"];
  }, [user.healthcareProfessional]);
  const [activeTab, setActiveTab] = useLocalStorage("person-search-tab", 0);

  const actions = useMemo(() => {
    if (!person.actions?.length) return [];
    if (!search?.length) return [];
    return filterBySearch(search, person.actions);
  }, [search, person.actions]);

  const treatments = useMemo(() => {
    if (!person.treatments?.length) return [];
    if (!search?.length) return [];
    return filterBySearch(search, person.treatments);
  }, [search, person.treatments]);

  const consultations = useMemo(() => {
    if (!person.consultations?.length) return [];
    if (!search?.length) return [];
    return filterBySearch(
      search,
      person.consultations.filter((c) => {
        if (!c.onlyVisibleBy?.length) return true;
        return c.onlyVisibleBy.includes(user._id);
      })
    );
  }, [search, person.consultations, user._id]);

  const places = useMemo(() => {
    if (!person.places?.length) return [];
    if (!search?.length) return [];
    return filterBySearch(search, person.places);
  }, [search, person.places]);

  const comments = useMemo(() => {
    if (!person.comments?.length) return [];
    if (!search?.length) return [];
    return filterBySearch(search, person.comments);
  }, [search, person.comments]);

  const commentsMedical = useMemo(() => {
    if (!person.commentsMedical?.length) return [];
    if (!search?.length) return [];
    return filterBySearch(search, person.commentsMedical);
  }, [search, person.commentsMedical]);

  const documents = useMemo(() => {
    if (!person.documents?.length) return [];
    if (!search?.length) return [];
    return filterBySearch(search, person.documents);
  }, [search, person.documents]);

  if (!search) return <>Pas de recherche, pas de résultat !</>;
  if (search.length < 3) return <>Recherche trop courte (moins de 3 caractères), pas de résultat !</>;

  return (
    <>
      <TabsNav
        className="tw-justify-center tw-px-3 tw-py-2"
        tabs={[
          `Actions (${actions.length})`,
          `Commentaires non médicaux (${comments.length})`,
          `Lieux (${places.length})`,
          !!user.healthcareProfessional && `Consultations (${consultations.length})`,
          !!user.healthcareProfessional && `Traitements (${treatments.length})`,
          !!user.healthcareProfessional && `Commentaires médicaux (${commentsMedical.length})`,
          `Documents non médicaux (${documents.length})`,
        ].filter(Boolean)}
        onClick={(tab) => {
          if (tab.includes("Actions")) setActiveTab("Actions");
          if (tab.includes("Commentaires non médicaux")) setActiveTab("Commentaires non médicaux");
          if (tab.includes("Lieux")) setActiveTab("Lieux");
          if (tab.includes("Consultations")) setActiveTab("Consultations");
          if (tab.includes("Traitements")) setActiveTab("Traitements");
          if (tab.includes("Commentaires médicaux")) setActiveTab("Commentaires médicaux");
          if (tab.includes("Documents non médicaux")) setActiveTab("Documents non médicaux");
        }}
        activeTabIndex={initTabs.findIndex((tab) => tab === activeTab)}
      />
      <div className="[&_table]:!tw-p0 tw-w-full tw-rounded-lg tw-bg-white tw-px-8 tw-py-4 print:tw-mb-4 [&_.title]:!tw-pb-5">
        {activeTab === "Actions" && <ActionsSortableList data={actions} />}
        {activeTab === "Commentaires non médicaux" && <CommentsSortableList data={comments} />}
        {activeTab === "Lieux" && <Places places={places} />}
        {activeTab === "Consultations" && <ActionsSortableList data={consultations} />}
        {activeTab === "Traitements" && <TreatmentsSortableList treatments={treatments} />}
        {activeTab === "Commentaires médicaux" && <CommentsSortableList data={commentsMedical} className="medical" />}
        {activeTab === "Documents non médicaux" && (
          <pre>
            <DocumentsModule
              documents={documents}
              personId={person._id}
              color="main"
              showAddDocumentButton={false}
              onDeleteDocument={() => null}
              onSubmitDocument={() => null}
              socialOrMedical="social"
              canToggleGroupCheck={false}
              onDeleteFolder={() => null}
              showPanel={false}
              onSaveNewOrder={() => null}
              title=""
            />
          </pre>
        )}
      </div>
    </>
  );
}

const Places = ({ places }) => {
  return (
    <Table
      className="Table"
      noData="Pas de lieu fréquenté"
      data={places}
      rowKey="_id"
      columns={[
        { title: "Nom", dataKey: "name" },
        { title: "Créée le", dataKey: "createdAt", render: (place) => formatDateWithFullMonth(place.createdAt) },
      ]}
    />
  );
};
