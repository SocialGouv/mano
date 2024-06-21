import React, { useState } from "react";
import { Formik } from "formik";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import { teamsState, userState } from "../../recoil/auth";
import ButtonCustom from "../../components/ButtonCustom";
import { fieldsPersonsCustomizableOptionsSelector, usePreparePersonForEncryption } from "../../recoil/persons";
import API, { tryFetchExpectOk } from "../../services/api";
import { outOfBoundariesDate } from "../../services/date";
import SelectCustom from "../../components/SelectCustom";
import DatePicker from "../../components/DatePicker";
import { useDataLoader } from "../../components/DataLoader";
import { cleanHistory } from "../../utils/person-history";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";

const OutOfActiveList = ({ person }) => {
  const [open, setOpen] = useState(false);
  const { refresh } = useDataLoader();
  const teams = useRecoilValue(teamsState);

  const { encryptPerson } = usePreparePersonForEncryption();
  const user = useRecoilValue(userState);

  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);

  const reintegerInActiveList = async () => {
    const historyEntry = {
      date: new Date(),
      user: user._id,
      data: {
        outOfActiveList: { oldValue: true, newValue: false },
        outOfActiveListReasons: { oldValue: person.outOfActiveListReasons, newValue: [] },
        outOfActiveListDate: { oldValue: person.outOfActiveListDate, newValue: null },
      },
    };

    const history = [...(cleanHistory(person.history) || []), historyEntry];
    const [error] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/person/${person._id}`,
        body: await encryptPerson({ ...person, outOfActiveList: false, outOfActiveListReasons: [], outOfActiveListDate: null, history }),
      })
    );
    if (!error) {
      await refresh();
      toast.success(person.name + " est réintégré dans la file active");
    }
  };

  const setOutOfActiveList = async (data) => {
    if (data.team === "all") {
      if (data.outOfActiveListDate && outOfBoundariesDate(data.outOfActiveListDate))
        return toast.error("La date de sortie de file active est hors limites (entre 1900 et 2100)");
      const historyEntry = {
        date: new Date(),
        user: user._id,
        data: {
          outOfActiveList: { newValue: true },
          outOfActiveListReasons: { newValue: data.outOfActiveListReasons },
          outOfActiveListDate: { newValue: data.outOfActiveListDate },
        },
      };

      const [error] = await tryFetchExpectOk(async () =>
        API.put({
          path: `/person/${person._id}`,
          body: await encryptPerson({
            ...person,
            ...data,
            outOfActiveList: true,
            history: [...(cleanHistory(person.history) || []), historyEntry],
          }),
        })
      );
      if (!error) {
        await refresh();
        toast.success(person.name + " est hors de la file active");
      }
    } else {
      const nextAssignedTeams = person.assignedTeams.filter((team) => team !== data.team);
      if (nextAssignedTeams.length < 1) {
        return toast.error("Une personne doit être suivie par au moins une équipe");
      }
      const historyEntry = {
        date: new Date(),
        user: user._id,
        data: {
          assignedTeams: {
            oldValue: person.assignedTeams,
            newValue: nextAssignedTeams,
          },
          outOfTeamsInformations: [
            {
              team: data.team,
              reasons: data.outOfActiveListReasons,
            },
          ],
        },
      };

      const history = [...(cleanHistory(person.history) || []), historyEntry];

      const [error] = await tryFetchExpectOk(async () =>
        API.put({
          path: `/person/${person._id}`,
          body: await encryptPerson({
            ...person,
            assignedTeams: person.assignedTeams.filter((team) => team !== data.team),
            history,
          }),
        })
      );
      if (!error) {
        await refresh();
        toast.success(person.name + " est hors de la file active de " + teams.find((t) => t._id === data.team)?.name);
      }
    }

    setOpen(false);
  };

  const teamsWithAll = [{ _id: "all", name: "Toute l'organisation" }, ...teams.filter((t) => person.assignedTeams.includes(t._id))];

  return (
    <>
      <ButtonCustom
        title={person.outOfActiveList ? "Réintégrer dans la file active" : "Sortie de file active"}
        type="button"
        onClick={() => (person.outOfActiveList ? reintegerInActiveList() : setOpen(true))}
        color={"warning"}
      />
      <ModalContainer open={open} size="full">
        <ModalHeader title={`Sortie de file active de ${person.name}`} />
        <Formik initialValues={{ team: "all", outOfActiveListDate: Date.now(), outOfActiveListReasons: [] }} onSubmit={setOutOfActiveList}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <ModalBody overflowY={false}>
                <div className="tw-p-4">
                  <div className="tw-p-4 tw-grid tw-grid-cols-3 tw-gap-2">
                    <div>
                      <label htmlFor="person-name">Sortie de file active de</label>
                      <SelectCustom
                        name="team"
                        options={teamsWithAll}
                        onChange={(value) => handleChange({ currentTarget: { value: value._id, name: "team" } })}
                        value={teamsWithAll.find((t) => t._id === values.team)}
                        getOptionValue={(team) => team._id}
                        getOptionLabel={(team) => team.name}
                        isDisabled={false}
                      />
                    </div>
                    <div>
                      <label htmlFor="person-select-outOfActiveListReasons">Motif(s) de sortie </label>
                      <SelectCustom
                        options={fieldsPersonsCustomizableOptions
                          .find((f) => f.name === "outOfActiveListReasons")
                          .options?.map((_option) => ({ value: _option, label: _option }))}
                        name="outOfActiveListReasons"
                        onChange={(values) => handleChange({ currentTarget: { value: values.map((v) => v.value), name: "outOfActiveListReasons" } })}
                        isClearable={false}
                        isMulti
                        inputId="person-select-outOfActiveListReasons"
                        classNamePrefix="person-select-outOfActiveListReasons"
                        value={values.outOfActiveListReasons?.map((_option) => ({ value: _option, label: _option })) || []}
                        placeholder={"Choisir..."}
                        getOptionValue={(i) => i.value}
                        getOptionLabel={(i) => i.label}
                      />
                    </div>
                    <div>
                      <label htmlFor="person-birthdate">Date de sortie de file active</label>
                      <div>
                        <DatePicker
                          disabled={values.team !== "all"}
                          id="outOfActiveListDate"
                          defaultValue={values.outOfActiveListDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <ButtonCustom title="Annuler" type="button" onClick={() => setOpen(false)} color="secondary" />
                <ButtonCustom title="Sauvegarder" type="submit" onClick={handleSubmit} color="primary" disabled={isSubmitting} />
              </ModalFooter>
            </React.Fragment>
          )}
        </Formik>
      </ModalContainer>
    </>
  );
};

export default OutOfActiveList;
