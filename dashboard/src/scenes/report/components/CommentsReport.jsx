import React, { useState } from "react";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import TabsNav from "../../../components/tailwind/TabsNav";
import { userState } from "../../../recoil/auth";
import { useRecoilValue } from "recoil";
import { useLocalStorage } from "../../../services/useLocalStorage";
import CommentsSortableList from "../../../components/CommentsSortableList";

export const CommentsSocialAndMedical = ({ comments, commentsMedical }) => {
  const [activeTab, setActiveTab] = useLocalStorage("reports-comments-toggle", "Commentaires");
  const [fullScreen, setFullScreen] = useState(false);
  const user = useRecoilValue(userState);
  const canSeeMedicalData = ["admin", "normal"].includes(user.role) && !!user.healthcareProfessional;

  const data = canSeeMedicalData && activeTab.includes("Commentaires médicaux") ? commentsMedical : comments;
  const tabs = canSeeMedicalData
    ? [`Commentaires (${comments.length})`, `Commentaires médicaux (${commentsMedical.length})`]
    : [`Commentaires (${comments.length})`];

  return (
    <>
      <section title={activeTab} className="noprint tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
        <div className="tw-flex tw-items-center tw-bg-white tw-px-3 tw-py-3">
          <TabsNav
            className="tw-m-0 tw-flex-wrap tw-justify-start tw-border-b-0 tw-py-0.5 tw-pl-0 [&_button]:tw-text-xl"
            tabs={tabs}
            renderTab={(caption) => <h3 className="m-0 tw-text-base tw-font-medium">{caption}</h3>}
            onClick={(_, index) => setActiveTab(index === 0 ? "Commentaires" : "Commentaires médicaux")}
            activeTabIndex={activeTab.includes("Commentaires médicaux") ? 1 : 0}
          />
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              title="Passer les commentaires en plein écran"
              className={[
                "tw-h-6 tw-w-6 tw-rounded-full tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30",
                activeTab.includes("Commentaires médicaux") ? "tw-text-blue-900" : "tw-text-main",
              ].join(" ")}
              disabled={!data.length}
              onClick={() => setFullScreen(true)}
            >
              <FullScreenIcon />
            </button>
          </div>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20 tw-pb-10">
          <CommentsSortableList data={data} className={activeTab.includes("Commentaires médicaux") ? "medical" : ""} />
        </div>
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
      >
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Commentaires ({comments.length})</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <CommentsSortableList data={comments} />
        </div>
      </section>
      {!!canSeeMedicalData && (
        <section
          aria-hidden="true"
          className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
        >
          <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
            <h3 className="tw-m-0 tw-text-base tw-font-medium">Commentaires médicaux ({commentsMedical.length})</h3>
          </div>
          <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
            <CommentsSortableList data={commentsMedical} className="medical" />
          </div>
        </section>
      )}
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`${activeTab} (${data.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <CommentsSortableList data={data} className={activeTab.includes("Commentaires médicaux") ? "medical" : ""} />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};
