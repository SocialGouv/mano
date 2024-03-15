import React, { useState } from "react";
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Label } from "reactstrap";
import { Formik } from "formik";
import { toast } from "react-toastify";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "../../recoil/auth";
import ButtonCustom from "../../components/ButtonCustom";
import { fieldsPersonsCustomizableOptionsSelector, personsState, usePreparePersonForEncryption } from "../../recoil/persons";
import API from "../../services/api";
import { outOfBoundariesDate } from "../../services/date";
import SelectCustom from "../../components/SelectCustom";
import { cleanHistory } from "./components/PersonHistory";
import DatePicker from "../../components/DatePicker";

const OutOfActiveList = ({ person }) => {
  const [open, setOpen] = useState(false);

  const preparePersonForEncryption = usePreparePersonForEncryption();
  const user = useRecoilValue(userState);

  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const setPersons = useSetRecoilState(personsState);

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
    const response = await API.put({
      path: `/person/${person._id}`,
      body: preparePersonForEncryption({ ...person, outOfActiveList: false, outOfActiveListReasons: [], outOfActiveListDate: null, history }),
    });
    if (response.ok) {
      const newPerson = response.decryptedData;
      setPersons((persons) =>
        persons.map((p) => {
          if (p._id === person._id) return newPerson;
          return p;
        })
      );
      toast.success(person.name + " est réintégré dans la file active");
    }
  };

  const setOutOfActiveList = async (updatedPerson) => {
    updatedPerson.outOfActiveList = true;

    if (updatedPerson.outOfActiveListDate && outOfBoundariesDate(updatedPerson.outOfActiveListDate))
      return toast.error("La date de sortie de file active est hors limites (entre 1900 et 2100)");

    const historyEntry = {
      date: new Date(),
      user: user._id,
      data: {
        outOfActiveList: { newValue: true },
        outOfActiveListReasons: { newValue: updatedPerson.outOfActiveListReasons },
        outOfActiveListDate: { newValue: updatedPerson.outOfActiveListDate },
      },
    };

    updatedPerson.history = [...(cleanHistory(person.history) || []), historyEntry];
    const response = await API.put({
      path: `/person/${person._id}`,
      body: preparePersonForEncryption(updatedPerson),
    });
    if (response.ok) {
      const newPerson = response.decryptedData;
      setPersons((persons) =>
        persons.map((p) => {
          if (p._id === person._id) return newPerson;
          return p;
        })
      );
      toast.success(person.name + " est hors de la file active");
    }
  };

  return (
    <>
      <ButtonCustom
        title={person.outOfActiveList ? "Réintégrer dans la file active" : "Sortie de file active"}
        type="button"
        onClick={() => (person.outOfActiveList ? reintegerInActiveList() : setOpen(true))}
        color={"warning"}
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader className="tw-break-all" toggle={() => setOpen(false)}>
          Sortie de file active de {person.name}
        </ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ ...person, outOfActiveListDate: Date.now(), outOfActiveListReasons: [] }}
            onSubmit={async (body) => {
              await setOutOfActiveList(body);
              setOpen(false);
            }}
          >
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <label htmlFor="person-select-outOfActiveListReasons">
                        Veuillez préciser le(s) motif(s) de sortie
                        <SelectCustom
                          options={fieldsPersonsCustomizableOptions
                            .find((f) => f.name === "outOfActiveListReasons")
                            .options?.map((_option) => ({ value: _option, label: _option }))}
                          name="outOfActiveListReasons"
                          onChange={(values) =>
                            handleChange({ currentTarget: { value: values.map((v) => v.value), name: "outOfActiveListReasons" } })
                          }
                          isClearable={false}
                          isMulti
                          inputId="person-select-outOfActiveListReasons"
                          classNamePrefix="person-select-outOfActiveListReasons"
                          value={values.outOfActiveListReasons?.map((_option) => ({ value: _option, label: _option })) || []}
                          placeholder={"Choisir..."}
                          getOptionValue={(i) => i.value}
                          getOptionLabel={(i) => i.label}
                          styles={{ width: "800px" }}
                          style={{ width: "800px" }}
                        />
                      </label>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="person-birthdate">Date de sortie de file active</Label>
                      <div>
                        <DatePicker id="outOfActiveListDate" defaultValue={values.outOfActiveListDate} onChange={handleChange} />
                      </div>
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <div className="tw-mt-4 tw-flex tw-justify-end">
                  <ButtonCustom
                    onClick={() => !isSubmitting && handleSubmit()}
                    disabled={!!isSubmitting}
                    title={isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
                  />
                </div>
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

export default OutOfActiveList;
