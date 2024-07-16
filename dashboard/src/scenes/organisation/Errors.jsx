import API, { tryFetchExpectOk } from "../../services/api";
import { decrypt, derivedMasterKey, encryptItem, getHashedOrgEncryptionKey } from "../../services/encryption";
import { useRecoilValue } from "recoil";
import { organisationState, userState } from "../../recoil/auth";
import { useEffect, useState } from "react";
import Loading from "../../components/loading";
import Table from "../../components/table";
import { toast } from "react-toastify";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import KeyInput from "../../components/KeyInput";
import { useDataLoader } from "../../components/DataLoader";

const getErroredDecryption = async (item) => {
  try {
    await decrypt(item.encrypted, item.encryptedEntityKey, getHashedOrgEncryptionKey());
  } catch (_e) {
    return item;
  }
  return null;
};

async function fetchErrored(organisationId, path) {
  const query = {
    organisation: organisationId,
    limit: String(10000),
  };
  let page = 0;
  let finished = false;
  const erroredPersons = [];
  while (!finished) {
    const [error, res] = await tryFetchExpectOk(async () => {
      return API.get({ path, query: { ...query, page: String(page) } });
    });
    if (error) {
      toast.error("Erreur lors de la récupération des données en erreur, pas de chance");
      return [];
    }
    if (!res.hasMore) finished = true;
    const decryptedData = (await Promise.all(res.data.map((p) => getErroredDecryption(p)))).filter((e) => e);
    erroredPersons.push(...decryptedData.map((p) => ({ _id: p._id, type: path, data: p })));
  }
  return erroredPersons;
}

export default function Errors() {
  const user = useRecoilValue(userState);
  const { refresh } = useDataLoader();
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(undefined);
  const [data, setData] = useState(undefined);
  const organisation = useRecoilValue(organisationState);

  useEffect(() => {
    (async () => {
      let res = [];
      res.push(...(await fetchErrored(organisation._id, "person")));
      res.push(...(await fetchErrored(organisation._id, "group")));
      res.push(...(await fetchErrored(organisation._id, "report")));
      res.push(...(await fetchErrored(organisation._id, "passage")));
      res.push(...(await fetchErrored(organisation._id, "rencontre")));
      res.push(...(await fetchErrored(organisation._id, "action")));
      res.push(...(await fetchErrored(organisation._id, "territory")));
      res.push(...(await fetchErrored(organisation._id, "place")));
      res.push(...(await fetchErrored(organisation._id, "relPersonPlace")));
      res.push(...(await fetchErrored(organisation._id, "territory-observation")));
      res.push(...(await fetchErrored(organisation._id, "comment")));
      if (user.healthcareProfessional) {
        res.push(...(await fetchErrored(organisation._id, "consultation")));
        res.push(...(await fetchErrored(organisation._id, "treatment")));
        res.push(...(await fetchErrored(organisation._id, "medical-file")));
      }

      setData(res);
    })();
  }, [organisation._id, user.healthcareProfessional]);

  if (!data)
    return (
      <>
        <Disclaimer />
        <Loading />
        <div className="tw-italic tw-text-xs tw-text-center tw-w-96 tw-mx-auto tw-mt-8 tw-animate-pulse">
          Le chargement des données en erreur nécessite de recharger puis déchiffrer toute la base de données, cela peut être long…
        </div>
      </>
    );

  return (
    <div>
      <Disclaimer />
      <div className="tw-mt-8">
        <Table
          data={data}
          rowKey={"_id"}
          noData="Aucune donnée en erreur"
          onRowClick={(row) => console.log(row)}
          columns={[
            { title: "_id", dataKey: "_id" },
            { title: "Type", dataKey: "type" },
            {
              title: "Déchiffrer",
              dataKey: "action-dechiffrer",
              render: (row) => (
                <button
                  className="button-classic"
                  onClick={() => {
                    console.log(row);
                    setItem(row);
                    setOpen(true);
                  }}
                >
                  Déchiffrer / Réparer
                </button>
              ),
            },
            {
              title: "Supprimer",
              dataKey: "action-supprimer",
              render: (item) => (
                <button
                  className="button-destructive"
                  onClick={async () => {
                    if (!confirm("Voulez-vous vraiment de vouloir supprimer cette donnée ?")) return;
                    if (item.type === "person") {
                      await API.delete({
                        path: `/person/${item.data._id}`,
                        body: {
                          actionsToTransfer: [],
                          commentsToTransfer: [],
                          actionIdsToDelete: [],
                          commentIdsToDelete: [],
                          passageIdsToDelete: [],
                          rencontreIdsToDelete: [],
                          consultationIdsToDelete: [],
                          treatmentIdsToDelete: [],
                          medicalFileIdsToDelete: [],
                          relsPersonPlaceIdsToDelete: [],
                        },
                      });
                    }
                    if (item.type === "group") {
                      await API.delete({ path: `/group/${item.data._id}` });
                    }
                    if (item.type === "report") {
                      await API.delete({ path: `/report/${item.data._id}` });
                    }
                    if (item.type === "passage") {
                      await API.delete({ path: `/passage/${item.data._id}` });
                    }
                    if (item.type === "rencontre") {
                      await API.delete({ path: `/rencontre/${item.data._id}` });
                    }
                    if (item.type === "action") {
                      await API.delete({ path: `/action/${item.data._id}` });
                    }
                    if (item.type === "territory") {
                      await API.delete({ path: `/territory/${item.data._id}` });
                    }
                    if (item.type === "place") {
                      await API.delete({ path: `/place/${item.data._id}` });
                    }
                    if (item.type === "relPersonPlace") {
                      await API.delete({ path: `/relPersonPlace/${item.data._id}` });
                    }
                    if (item.type === "territory-observation") {
                      await API.delete({ path: `/territory-observation/${item.data._id}` });
                    }
                    if (item.type === "comment") {
                      await API.delete({ path: `/comment/${item.data._id}` });
                    }
                    if (user.healthcareProfessional && item.type === "consultation") {
                      await API.delete({ path: `/consultation/${item.data._id}` });
                    }
                    if (user.healthcareProfessional && item.type === "treatment") {
                      await API.delete({ path: `/treatment/${item.data._id}` });
                    }
                    if (user.healthcareProfessional && item.type === "medical-file") {
                      await API.delete({ path: `/medical-file/${item.data._id}` });
                    }
                    await refresh();
                    toast.success("L'élément a été supprimé !");
                  }}
                >
                  Supprimer
                </button>
              ),
            },
          ]}
        />
      </div>
      <ModalRepair open={open} setOpen={setOpen} item={item} />
    </div>
  );
}

function ModalRepair({ open, setOpen, item }) {
  const user = useRecoilValue(userState);
  const [key, setKey] = useState("");
  const { refresh } = useDataLoader();

  async function testAndFixKey() {
    const itemData = structuredClone(item.data);
    const derived = await derivedMasterKey(key);
    try {
      const { content } = await decrypt(item.data.encrypted, item.data.encryptedEntityKey, derived);
      itemData.decrypted = JSON.parse(content);
    } catch (_e) {
      toast.error("La clé de chiffrement ne fonctionne pas pour cet élément");
      return;
    }
    toast.success("La clé de chiffrement est valide");
    delete itemData.encrypted;
    delete itemData.encryptedEntityKey;
    delete itemData.entityKey;
    const encryptedItem = await encryptItem(itemData);

    if (item.type === "person") {
      await API.put({ path: `/person/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "group") {
      await API.put({ path: `/group/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "report") {
      await API.put({ path: `/report/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "passage") {
      await API.put({ path: `/passage/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "rencontre") {
      await API.put({ path: `/rencontre/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "action") {
      await API.put({ path: `/action/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "territory") {
      await API.put({ path: `/territory/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "place") {
      await API.put({ path: `/place/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "relPersonPlace") {
      await API.put({ path: `/relPersonPlace/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "territory-observation") {
      await API.put({ path: `/territory-observation/${itemData._id}`, body: encryptedItem });
    }
    if (item.type === "comment") {
      await API.put({ path: `/comment/${itemData._id}`, body: encryptedItem });
    }
    if (user.healthcareProfessional && item.type === "consultation") {
      await API.put({ path: `/consultation/${itemData._id}`, body: encryptedItem });
    }
    if (user.healthcareProfessional && item.type === "treatment") {
      await API.put({ path: `/treatment/${itemData._id}`, body: encryptedItem });
    }
    if (user.healthcareProfessional && item.type === "medical-file") {
      await API.put({ path: `/medical-file/${itemData._id}`, body: encryptedItem });
    }
    await refresh();
    toast.success("L'élément a été réparé !");
    setOpen(false);
  }

  if (!item) return null;

  return (
    <ModalContainer open={open} onClose={() => setOpen(false)} size="xl">
      <ModalHeader title={"Réparer " + item._id} />
      <ModalBody>
        <div className="tw-p-4">
          <label htmlFor="test-key">Clé de chiffrement à essayer</label>
          <KeyInput
            id="test-key"
            onPressEnter={() => {
              testAndFixKey();
            }}
            onChange={(e) => {
              setKey(e);
            }}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="button-classic" onClick={() => setOpen(false)}>
          Fermer
        </button>
        <button className="button-submit" onClick={() => testAndFixKey()}>
          Tester la clé
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}

function Disclaimer() {
  return (
    <div className="tw-mb-8 tw-border-l-4 tw-border-orange-500 tw-bg-orange-100 tw-p-4 tw-text-orange-700" role="alert">
      Vous retrouvez ici les données corrompues ou non déchiffrables. Vous pouvez tenter de les restaurer en essayant une ancienne clé de chiffrement.
    </div>
  );
}
