import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { utils, writeFile } from "@e965/xlsx";
import { useLocalStorage } from "../../services/useLocalStorage";
import { CustomResponsiveBar, CustomResponsivePie } from "./Charts";
import Filters, { filterData } from "../../components/Filters";
import { getDuration, getMultichoiceBarData, getPieData } from "./utils";
import Card from "../../components/Card";
import { capture } from "../../services/sentry";
import { Block } from "./Blocks";
import CustomFieldsStats from "./CustomFieldsStats";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import { organisationState, teamsState, userState } from "../../recoil/auth";
import { customFieldsPersonsSelector, personFieldsIncludingCustomFieldsSelector, sortPersons } from "../../recoil/persons";
import TagTeam from "../../components/TagTeam";
import Table from "../../components/table";
import { dayjsInstance, formatDateWithFullMonth } from "../../services/date";
import CustomFieldDisplay from "../../components/CustomFieldDisplay";
import { groupsState } from "../../recoil/groups";
import EvolutiveStatsSelector from "../../components/EvolutiveStatsSelector";
import EvolutiveStatsViewer from "../../components/EvolutiveStatsViewer";

export default function PersonStats({
  title,
  firstBlockHelp,
  filterBase,
  filterPersons,
  setFilterPersons,
  personsForStats,
  personFields,
  period,
  evolutivesStatsActivated,
  evolutiveStatsIndicators,
  setEvolutiveStatsIndicators,
  viewAllOrganisationData,
  selectedTeamsObjectWithOwnPeriod,
}) {
  const allGroups = useRecoilValue(groupsState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const user = useRecoilValue(userState);

  const [personsModalOpened, setPersonsModalOpened] = useState(false);
  const [sliceField, setSliceField] = useState(null);
  const [sliceValue, setSliceValue] = useState(null);
  const [slicedData, setSlicedData] = useState([]);

  const groupsForPersons = useMemo(() => {
    const groupIds = new Set();
    for (const person of personsForStats) {
      if (person.group) {
        groupIds.add(person.group._id);
      }
    }
    return allGroups.filter((group) => groupIds.has(group._id));
  }, [personsForStats, allGroups]);

  const onSliceClick = (newSlice, fieldName, personConcerned = personsForStats) => {
    if (["stats-only"].includes(user.role)) return;
    const newSlicefield = filterBase.find((f) => f.field === fieldName);
    if (!newSlicefield) {
      capture("newSlicefield not found in person stats", { extra: { fieldName, filterBase } });
      return;
    }
    setSliceField(newSlicefield);
    setSliceValue(newSlice);
    const slicedData =
      newSlicefield.type === "boolean"
        ? personConcerned.filter((p) => (newSlice === "Non" ? !p[newSlicefield.field] : !!p[newSlicefield.field]))
        : filterData(
            personConcerned,
            [{ ...newSlicefield, value: newSlice, type: newSlicefield.field === "outOfActiveList" ? "boolean" : newSlicefield.field }],
            true
          );
    setSlicedData(slicedData);
    setPersonsModalOpened(true);
  };
  return (
    <>
      {!evolutivesStatsActivated && <h3 className="tw-my-5 tw-text-xl">Statistiques des {title}</h3>}
      <Filters base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      {evolutivesStatsActivated ? (
        <>
          <EvolutiveStatsSelector
            title={<h4 className="tw-inline tw-text-lg tw-text-black75">Évolution des indicateurs</h4>}
            filterBase={filterBase}
            selection={evolutiveStatsIndicators}
            onChange={setEvolutiveStatsIndicators}
          />
          {!!evolutiveStatsIndicators.length && (
            <EvolutiveStatsViewer
              evolutiveStatsIndicators={evolutiveStatsIndicators}
              period={period}
              persons={personsForStats}
              filterBase={filterBase}
              viewAllOrganisationData={viewAllOrganisationData}
              selectedTeamsObjectWithOwnPeriod={selectedTeamsObjectWithOwnPeriod}
            />
          )}
        </>
      ) : (
        <>
          <details
            open={import.meta.env.VITE_TEST_PLAYWRIGHT === "true" || window.localStorage.getItem("person-stats-general-open") === "true"}
            onToggle={(e) => {
              if (e.target.open) {
                window.localStorage.setItem("person-stats-general-open", "true");
              } else {
                window.localStorage.removeItem("person-stats-general-open");
              }
            }}
          >
            <summary className="tw-mx-0 tw-my-8">
              <h4 className="tw-inline tw-text-xl tw-text-black75">Général</h4>
            </summary>
            <div className="tw-flex tw-flex-col tw-gap-4">
              <div className="tw-grid tw-grid-cols-2 2xl:tw-grid-cols-4 tw-gap-4">
                <Block data={personsForStats} title={`Nombre de ${title}`} help={firstBlockHelp} />
                <BlockCreatedAt persons={personsForStats} />
                <BlockWanderingAt persons={personsForStats} />
                <BlockGroup groups={groupsForPersons} title={`Nombre de familles dans lesquelles se trouvent des ${title}`} />
              </div>
              <CustomResponsivePie
                title="Genre"
                field="gender"
                onItemClick={
                  user.role === "stats-only"
                    ? undefined
                    : (newSlice) => {
                        onSliceClick(newSlice, "gender");
                      }
                }
                data={getPieData(personsForStats, "gender", { options: personFields.find((f) => f.name === "gender").options })}
                help={`Genre des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
              />
              <AgeRangeBar
                persons={personsForStats}
                onItemClick={
                  user.role === "stats-only"
                    ? undefined
                    : (newSlice, data) => {
                        setSliceField(personFields.find((f) => f.name === "birthdate"));
                        setSliceValue(newSlice);
                        setSlicedData(data);
                        setPersonsModalOpened(true);
                      }
                }
              />
              <StatsCreatedAtRangeBar
                persons={personsForStats}
                onItemClick={
                  user.role === "stats-only"
                    ? undefined
                    : (newSlice, data) => {
                        setSliceField(personFields.find((f) => f.name === "followedSince"));
                        setSliceValue(newSlice);
                        setSlicedData(data);
                        setPersonsModalOpened(true);
                      }
                }
              />
              <StatsWanderingAtRangeBar
                persons={personsForStats}
                onItemClick={
                  user.role === "stats-only"
                    ? undefined
                    : (newSlice, data) => {
                        setSliceField(personFields.find((f) => f.name === "wanderingAt"));
                        setSliceValue(newSlice);
                        setSlicedData(data);
                        setPersonsModalOpened(true);
                      }
                }
              />
              <CustomResponsivePie
                title="Personnes très vulnérables"
                field="alertness"
                onItemClick={
                  user.role === "stats-only"
                    ? undefined
                    : (newSlice) => {
                        onSliceClick(newSlice, "alertness");
                      }
                }
                data={getPieData(personsForStats, "alertness", { isBoolean: true })}
                help={`${title.capitalize()} vulnérables dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
              />
              <CustomResponsivePie
                title="Sortie de file active"
                field="outOfActiveList"
                onItemClick={
                  user.role === "stats-only"
                    ? undefined
                    : (newSlice) => {
                        onSliceClick(newSlice, "outOfActiveList");
                      }
                }
                data={getPieData(personsForStats, "outOfActiveList", { isBoolean: true })}
                help={`${title} dans la période définie, sorties de la file active. La date de sortie de la file active n'est pas nécessairement dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
              />
              <CustomResponsiveBar
                title="Raison de sortie de file active"
                help={`Raisons de sortie de file active des ${title} dans la période définie, sorties de la file active. La date de sortie de la file active n'est pas nécessairement dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
                onItemClick={
                  user.role === "stats-only"
                    ? undefined
                    : (newSlice) => {
                        onSliceClick(
                          newSlice,
                          "outOfActiveListReasons",
                          personsForStats.filter((p) => !!p.outOfActiveList)
                        );
                      }
                }
                axisTitleY="File active"
                axisTitleX="Raison de sortie de file active"
                isMultiChoice
                totalForMultiChoice={personsForStats.filter((p) => !!p.outOfActiveList).length}
                totalTitleForMultiChoice={<span className="tw-font-bold">Nombre de personnes concernées</span>}
                data={getMultichoiceBarData(
                  personsForStats.filter((p) => !!p.outOfActiveList),
                  "outOfActiveListReasons"
                )}
              />
              <StatsPersonsByFamille groupsForPersons={groupsForPersons} />
            </div>
          </details>
          {customFieldsPersons.map((section) => {
            return (
              <details
                key={section.name}
                className="print:tw-break-before-page"
                open={
                  import.meta.env.VITE_TEST_PLAYWRIGHT === "true" ||
                  window.localStorage.getItem(`person-stats-${section.name.replace(" ", "-").toLocaleLowerCase()}-open`) === "true"
                }
                onToggle={(e) => {
                  if (e.target.open) {
                    window.localStorage.setItem(`person-stats-${section.name.replace(" ", "-").toLocaleLowerCase()}-open`, "true");
                  } else {
                    window.localStorage.removeItem(`person-stats-${section.name.replace(" ", "-").toLocaleLowerCase()}-open`);
                  }
                }}
              >
                <summary className="tw-mx-0 tw-my-8">
                  <h4 className="tw-inline tw-text-xl tw-text-black75">{section.name}</h4>
                </summary>
                <CustomFieldsStats
                  data={personsForStats}
                  customFields={section.fields}
                  onSliceClick={user.role === "stats-only" ? undefined : onSliceClick}
                  help={(label) =>
                    `${label.capitalize()} des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`
                  }
                  totalTitleForMultiChoice={<span className="tw-font-bold">Nombre de personnes concernées</span>}
                />
              </details>
            );
          })}
        </>
      )}
      <SelectedPersonsModal
        open={personsModalOpened}
        onClose={() => {
          setPersonsModalOpened(false);
        }}
        persons={slicedData}
        sliceField={sliceField}
        onAfterLeave={() => {
          setSliceField(null);
          setSliceValue(null);
          setSlicedData([]);
        }}
        title={`${sliceField?.label} : ${sliceValue} (${slicedData.length})`}
      />
    </>
  );
}

const BlockWanderingAt = ({ persons }) => {
  persons = persons.filter((p) => Boolean(p.wanderingAt));
  if (!persons.length) {
    return <Card title="Temps d'errance des personnes en&nbsp;moyenne" unit={"N/A"} count={0} />;
  }
  const averageWanderingAt = persons.reduce((total, person) => total + Date.parse(person.wanderingAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageWanderingAt;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <Card
      title="Temps d'errance des personnes en&nbsp;moyenne"
      unit={unit}
      count={count}
      help={`Cela veut dire qu'en moyenne, chaque personne considérée est en rue depuis ${count} ${unit}`}
    />
  );
};

const BlockGroup = ({ title, groups }) => {
  try {
    if (!groups.length) {
      return (
        <Card
          title={title}
          count={0}
          help={`Une personne ne peut appartenir qu'à une famille. On comptabilise donc le nombre de familles dans lesquelles se trouvent les personnes concernées.\n\nSi plusieurs personnes appartiennent à la même famille, on comptabilisera seulement une seule famille.`}
        />
      );
    }

    const avg = Math.round((groups.reduce((total, group) => total + group.relations.length, 0) / groups.length) * 100) / 100;
    return (
      <Card
        title={title}
        count={groups.length}
        help={`Une personne ne peut appartenir qu'à une famille. On comptabilise donc le nombre de familles dans lesquelles se trouvent les personnes concernées.\n\nSi plusieurs personnes appartiennent à la même famille, on comptabilisera seulement une seule famille.`}
      >
        <span className="font-weight-normal">
          Taille moyenne des familles: <strong>{avg}</strong>
        </span>
      </Card>
    );
  } catch (errorBlockTotal) {
    capture("error block total", errorBlockTotal, { title, groups });
  }
  return null;
};

const BlockCreatedAt = ({ persons }) => {
  if (persons.length === 0) {
    return <Card title="Temps de suivi moyen" count={"-"} />;
  }

  const averageFollowedTime =
    persons.reduce((total, person) => {
      let totalFollowedTime = 0;
      let followStart = Date.parse(person.followedSince || person.createdAt);

      const history = person.history || [];

      const outOfActiveListEntries = history.filter((hist) => !!hist.data.outOfActiveListDate && !!hist.data.outOfActiveList);
      if (!outOfActiveListEntries.length) {
        totalFollowedTime += Date.now() - followStart;
      } else {
        for (const historyEntry of outOfActiveListEntries) {
          if (historyEntry.data.outOfActiveList.newValue === true) {
            const outOfActiveListDate = historyEntry.data.outOfActiveListDate.newValue;
            const formattedDate = typeof outOfActiveListDate === "number" ? outOfActiveListDate : Date.parse(outOfActiveListDate);
            if (!isNaN(formattedDate)) {
              totalFollowedTime += formattedDate - followStart;
            }
          } else {
            followStart = Date.parse(historyEntry.date);
          }
        }
        if (!person.outOfActiveList) {
          totalFollowedTime += Date.now() - followStart;
        }
      }

      return total + totalFollowedTime;
    }, 0) / (persons.length || 1);

  const [count, unit] = getDuration(averageFollowedTime);

  return (
    <Card
      title="Temps de suivi moyen"
      unit={unit}
      count={count}
      help={`Cela veut dire qu'en moyenne, chaque personne considérée est suivie depuis ${count} ${unit}`}
    />
  );
};

const initCategories = (categories) => {
  const objCategories = {};
  for (const cat of categories) {
    objCategories[cat] = [];
  }
  return objCategories;
};

export const AgeRangeBar = ({ persons, onItemClick }) => {
  const categories = ["0 - 2", "3 - 17", "18 - 24", "25 - 44", "45 - 59", "60+", "Non renseigné"];

  const data = persons.reduce((newData, person) => {
    if (!person.birthdate || !person.birthdate.length) {
      newData["Non renseigné"].push(person);
      return newData;
    }
    // now person has an `age` field
    if (person.age < 2) {
      newData["0 - 2"].push(person);
      return newData;
    }
    if (person.age < 18) {
      newData["3 - 17"].push(person);
      return newData;
    }
    if (person.age < 25) {
      newData["18 - 24"].push(person);
      return newData;
    }
    if (person.age < 45) {
      newData["25 - 44"].push(person);
      return newData;
    }
    if (person.age < 60) {
      newData["45 - 59"].push(person);
      return newData;
    }
    newData["60+"].push(person);
    return newData;
  }, initCategories(categories));

  const dataCount = Object.keys(data)
    .filter((key) => data[key]?.length > 0)
    .map((key) => ({ name: key, [key]: data[key]?.length }));

  return (
    <CustomResponsiveBar
      title="Tranche d'âges"
      categories={categories.filter((c) => c !== "Non renseigné")}
      onItemClick={
        onItemClick
          ? (item) => {
              onItemClick(item, data[item]);
            }
          : null
      }
      data={dataCount}
      axisTitleX="Tranche d'âge"
      axisTitleY="Nombre de personnes"
      help={`Répartition des âges des personnes concernées, dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
    />
  );
};

const StatsCreatedAtRangeBar = ({ persons, onItemClick }) => {
  const categories = ["0-6 mois", "6-12 mois", "1-2 ans", "2-5 ans", "+ 5 ans"];

  let data = persons.reduce((newData, person) => {
    if (!person.followedSince || !person.createdAt || !person.createdAt.length) {
      return newData;
      // newData["Non renseigné"].push(person);
    }
    const parsedDate = Date.parse(person.followedSince || person.createdAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData["0-6 mois"].push(person);
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData["6-12 mois"].push(person);
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData["1-2 ans"].push(person);
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData["2-5 ans"].push(person);
      return newData;
    }
    newData["+ 5 ans"].push(person);
    return newData;
  }, initCategories(categories));

  const dataCount = Object.keys(data)
    .filter((key) => data[key]?.length > 0)
    .map((key) => ({ name: key, [key]: data[key]?.length }));

  return (
    <CustomResponsiveBar
      title="Temps de suivi (par tranche)"
      categories={categories}
      data={dataCount}
      onItemClick={
        onItemClick
          ? (item) => {
              onItemClick(item, data[item]);
            }
          : null
      }
      axisTitleX="Temps de suivi"
      axisTitleY="Nombre de personnes"
      help={`Répartition des temps de suivi des personnes concernées, dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
    />
  );
};

const StatsWanderingAtRangeBar = ({ persons, onItemClick }) => {
  const categories = ["0-6 mois", "6-12 mois", "1-2 ans", "2-5 ans", "5-10 ans", "+ 10 ans", "Non renseigné"];

  let data = persons.reduce((newData, person) => {
    if (!person.wanderingAt || !person.wanderingAt.length) {
      newData["Non renseigné"].push(person);
      return newData;
    }
    const parsedDate = Date.parse(person.wanderingAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData["0-6 mois"].push(person);
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData["6-12 mois"].push(person);
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData["1-2 ans"].push(person);
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData["2-5 ans"].push(person);
      return newData;
    }
    if (fromNowInMonths < 120) {
      newData["5-10 ans"].push(person);
      return newData;
    }
    newData["+ 10 ans"].push(person);
    return newData;
  }, initCategories(categories));

  const dataCount = Object.keys(data)
    .filter((key) => data[key]?.length > 0)
    .map((key) => ({ name: key, [key]: data[key]?.length }));

  return (
    <CustomResponsiveBar
      title="Temps d'errance (par tranche)"
      categories={categories}
      data={dataCount}
      onItemClick={
        onItemClick
          ? (item) => {
              onItemClick(item, data[item]);
            }
          : null
      }
      axisTitleX="Temps d'errance"
      axisTitleY="Nombre de personnes"
      help={`Répartition des temps d'errance des personnes concernées, dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
    />
  );
};

const Teams = ({ person: { _id, assignedTeams } }) => (
  <React.Fragment key={_id}>
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} />
    ))}
  </React.Fragment>
);

export const SelectedPersonsModal = ({ open, onClose, persons, title, onAfterLeave, sliceField }) => {
  const history = useHistory();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);

  const [sortBy, setSortBy] = useLocalStorage("person-sortBy", "name");
  const [sortOrder, setSortOrder] = useLocalStorage("person-sortOrder", "ASC");
  const data = useMemo(() => {
    return [...persons].sort(sortPersons(sortBy, sortOrder));
  }, [persons, sortBy, sortOrder]);

  if (!sliceField) return null;

  const exportXlsx = () => {
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(
      persons.map((person) => {
        return {
          id: person._id,
          ...personFieldsIncludingCustomFields
            .filter((person) => !["_id", "organisation", "user", "createdAt", "updatedAt", "documents", "history"].includes(person.name))
            .reduce((fields, field) => {
              if (field.name === "assignedTeams") {
                fields[field.label] = (person[field.name] || []).map((t) => teams.find((person) => person._id === t)?.name)?.join(", ");
              } else if (["date", "date-with-time", "duration"].includes(field.type))
                fields[field.label || field.name] = person[field.name] ? dayjsInstance(person[field.name]).format("YYYY-MM-DD") : "";
              else if (["boolean"].includes(field.type)) fields[field.label || field.name] = person[field.name] ? "Oui" : "Non";
              else if (["yes-no"].includes(field.type)) fields[field.label || field.name] = person[field.name];
              else if (Array.isArray(person[field.name])) fields[field.label || field.name] = person[field.name].join(", ");
              else fields[field.label || field.name] = person[field.name];
              return fields;
            }, {}),
          "Créé le": dayjsInstance(person.createdAt).format("YYYY-MM-DD"),
          "Mis à jour le": dayjsInstance(person.updatedAt).format("YYYY-MM-DD"),
        };
      })
    );
    utils.book_append_sheet(wb, ws, "Personnes suivies");
    writeFile(wb, `${title}.xlsx`);
  };
  return (
    <ModalContainer open={open} size="full" onClose={onClose} onAfterLeave={onAfterLeave}>
      <ModalHeader
        title={
          <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
            {title}{" "}
            <button onClick={exportXlsx} className="button-submit tw-ml-auto">
              Télécharger un export
            </button>
          </div>
        }
      ></ModalHeader>
      <ModalBody>
        <div className="tw-p-4">
          <Table
            data={data}
            rowKey={"_id"}
            noData="Pas de personne suivie"
            onRowClick={(p) => history.push(`/person/${p._id}`)}
            columns={[
              {
                title: "",
                dataKey: "group",
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortOrder,
                sortBy,
                small: true,
                render: (person) => {
                  if (!person.group) return null;
                  return (
                    <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                      <span className="tw-text-3xl" aria-label="Personne avec des liens familiaux" title="Personne avec des liens familiaux">
                        👪
                      </span>
                    </div>
                  );
                },
              },
              {
                title: "Nom",
                dataKey: "name",
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortOrder,
                sortBy,
              },
              {
                title: sliceField.label,
                dataKey: sliceField,
                render: (person) => {
                  return <CustomFieldDisplay type={sliceField.type} value={person[sliceField.field]} />;
                },
              },
              { title: "Équipe(s) en charge", dataKey: "assignedTeams", render: (person) => <Teams teams={teams} person={person} /> },
              {
                title: "Suivi(e) depuis le",
                dataKey: "followedSince",
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortOrder,
                sortBy,
                render: (p) => formatDateWithFullMonth(p.followedSince || p.createdAt || ""),
              },
            ].filter((c) => organisation.groupsEnabled || c.dataKey !== "group")}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            onClose(null);
          }}
        >
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

function StatsPersonsByFamille({ groupsForPersons }) {
  const counts = {};
  for (const p of groupsForPersons) {
    if (!p.relations?.length) continue;
    // On ajoute +1 pour la personne elle-même
    const length = p.relations?.length + 1;
    if (length >= 7) {
      if (!counts["Familles de 7+ personnes"]) counts["Familles de 7+ personnes"] = 0;
      counts["Familles de 7+ personnes"]++;
    } else {
      const text = "Famille de " + length + " personnes";
      if (!counts[text]) counts[text] = 0;
      counts[text]++;
    }
  }
  const data = Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))

    .map(([key, value]) => (value > 0 ? { name: key, [key]: value } : null))
    .filter(Boolean);
  return (
    <CustomResponsiveBar
      title="Nombre de personnes par familles"
      help={`Nombre de personnes par familles dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      axisTitleY="Nombre de familles concernées"
      axisTitleX="todo"
      totalTitleForMultiChoice={<span className="tw-font-bold">Nombre de personnes par famille</span>}
      data={data}
    />
  );
}
