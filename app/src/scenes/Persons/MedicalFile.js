import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Text } from 'react-native';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import Button from '../../components/Button';
import InputLabelled from '../../components/InputLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import ActionRow from '../../components/ActionRow';
import CommentRow from '../Comments/CommentRow';
import PlaceRow from '../Places/PlaceRow';
import SubList from '../../components/SubList';
import DateAndTimeInput, { displayBirthDate } from '../../components/DateAndTimeInput';
import GenderSelect from '../../components/Selects/GenderSelect';
import Spacer from '../../components/Spacer';
import NewCommentInput from '../Comments/NewCommentInput';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import TeamsMultiCheckBoxes from '../../components/MultiCheckBoxes/TeamsMultiCheckBoxes';
import colors from '../../utils/colors';
import PhoneIcon from '../../icons/PhoneIcon';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { actionsState } from '../../recoil/actions';
import { placesState } from '../../recoil/places';
import { commentsState } from '../../recoil/comments';
import { organisationState, teamsState, usersState, userState } from '../../recoil/auth';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import { customFieldsPersonsMedicalSelector, customFieldsPersonsSocialSelector, personsState } from '../../recoil/persons';
import { consultationsState } from '../../recoil/consultations';
import { treatmentsState } from '../../recoil/treatments';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../recoil/medicalFiles';
import API from '../../services/api';
import HealthInsuranceSelect from '../../components/Selects/HealthInsuranceSelect';
import CustomFieldInput from '../../components/CustomFieldInput';
import ConsultationRow from '../../components/ConsultationRow';
import TreatmentRow from '../../components/TreatmentRow';
import Document from '../../components/Document';
import DocumentsManager from '../../components/DocumentsManager';

const MedicalFile = ({
  navigation,
  person,
  personDB,
  onUpdatePerson,
  updating,
  editable,
  onEdit,
  isUpdateDisabled,
  backgroundColor,
  writeComment,
  onChange,
  onDelete,
  onBack,
}) => {
  const setPersons = useSetRecoilState(personsState);
  const user = useRecoilValue(userState);
  const users = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);

  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const [allConsultations, setAllConsultations] = useRecoilState(consultationsState);
  const [allTreatments, setAllTreatments] = useRecoilState(treatmentsState);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);

  const consultations = useMemo(() => (allConsultations || []).filter((c) => c.person === personDB._id), [allConsultations, personDB._id]);

  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === personDB._id), [allTreatments, personDB._id]);

  const medicalFileDB = useMemo(() => (allMedicalFiles || []).find((m) => m.person === personDB._id), [allMedicalFiles, personDB._id]);
  const [medicalFile, setMedicalFile] = useState(medicalFileDB);

  useEffect(() => {
    if (!medicalFileDB) {
      (async () => {
        const response = await API.post({
          path: '/medical-file',
          body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ person: personDB._id, documents: [], organisation: organisation._id }),
        });
        if (!response.ok) return;
        setAllMedicalFiles((medicalFiles) => [...medicalFiles, response.decryptedData]);
        setMedicalFile(response.decryptedData);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalFileDB]);

  const allMedicalDocuments = useMemo(() => {
    const ordonnances =
      treatments
        ?.map((treatment) => treatment.documents?.map((doc) => ({ ...doc, type: 'treatment', treatment })))
        .filter(Boolean)
        .flat() || [];
    const consultationsDocs =
      consultations
        ?.map((consultation) => consultation.documents?.map((doc) => ({ ...doc, type: 'consultation', consultation })))
        .filter(Boolean)
        .flat() || [];
    const otherDocs = medicalFile?.documents || [];
    return [...ordonnances, ...consultationsDocs, ...otherDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [consultations, medicalFile?.documents, treatments]);

  const scrollViewRef = useRef(null);
  const refs = useRef({});
  const _scrollToInput = (ref) => {
    if (!ref.current) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.current.measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  const isMedicalFileUpdateDisabled = useMemo(() => {
    if (JSON.stringify(medicalFileDB) !== JSON.stringify(medicalFile)) return false;
    return true;
  }, [medicalFileDB, medicalFile]);

  const onUpdateRequest = async () => {
    const response = await API.put({
      path: `/medical-file/${medicalFileDB._id}`,
      body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ ...medicalFileDB, ...medicalFile }),
    });
    if (!response.ok) return;
    setAllMedicalFiles((medicalFiles) =>
      medicalFiles.map((m) => {
        if (m._id === medicalFileDB._id) return response.decryptedData;
        return m;
      })
    );
    await onUpdatePerson();
  };

  const onAddConsultationRequest = () => null;
  const onAddTreatmentRequest = () => null;
  const onAddMedicalDocumentRequest = () => null;

  return (
    <ScrollContainer ref={scrollViewRef} backgroundColor={backgroundColor || colors.app.color} testID="person-summary">
      <InputLabelled
        label="Nom prénom ou Pseudonyme"
        onChangeText={(name) => onChange({ name })}
        value={person.name}
        placeholder="Monsieur X"
        editable={editable}
      />
      <GenderSelect onSelect={(gender) => onChange({ gender })} value={person.gender} editable={editable} />
      {editable ? (
        <DateAndTimeInput
          label="Date de naissance"
          setDate={(birthdate) => onChange({ birthdate })}
          date={person.birthdate}
          editable={editable}
          showYear
        />
      ) : (
        <InputLabelled label="Âge" value={displayBirthDate(person.birthdate, { reverse: true })} placeholder="JJ-MM-AAAA" editable={false} />
      )}
      <HealthInsuranceSelect value={person.healthInsurance} onSelect={(healthInsurance) => onChange({ healthInsurance })} editable={editable} />
      <InputLabelled
        label="Structure de suivi médical"
        onChangeText={(structureMedical) => onChange({ structureMedical })}
        value={person.structureMedical || (editable ? null : '-- Non renseignée --')}
        placeholder="Renseignez la structure médicale le cas échéant"
        editable={editable}
      />
      {customFieldsMedicalFile
        .filter((f) => f)
        .filter((f) => f.enabled)
        .map((field) => {
          const { label, name } = field;
          return (
            <CustomFieldInput
              key={label}
              label={label}
              field={field}
              value={medicalFile?.[name]}
              handleChange={(newValue) => setMedicalFile((file) => ({ ...file, [name]: newValue }))}
              editable={editable}
              ref={(r) => (refs.current[`${name}-ref`] = r)}
              onFocus={() => _scrollToInput(refs.current[`${name}-ref`])}
            />
          );
        })}

      <ButtonsContainer>
        <Button
          caption={editable ? 'Mettre à jour' : 'Modifier'}
          onPress={editable ? onUpdateRequest : onEdit}
          disabled={editable ? isUpdateDisabled && isMedicalFileUpdateDisabled : false}
          loading={updating}
        />
      </ButtonsContainer>
      <SubList
        label="Traitements"
        onAdd={onAddTreatmentRequest}
        data={treatments}
        renderItem={(treatment) => <TreatmentRow treatment={treatment} key={treatment._id} />}
        ifEmpty="Pas encore de traitement"
      />
      <SubList
        label="Consultations"
        onAdd={onAddConsultationRequest}
        testID="person-consultations-list"
        data={consultations}
        renderItem={(consultation) => <ConsultationRow consultation={consultation} key={consultation._id} />}
        ifEmpty="Pas encore de consultation"
      />
      <SubList
        label="Documents médicaux"
        data={allMedicalDocuments}
        renderItem={(medicalDocument) => (
          <DocumentRow key={medicalDocument.name}>
            <Document document={medicalDocument} />
          </DocumentRow>
        )}
        ifEmpty="Pas encore de document médical">
        <DocumentsManager personDB={personDB} onAddDocument={console.log} />
      </SubList>
    </ScrollContainer>
  );
};

const DocumentRow = styled.View`
  margin-horizontal: 30px;
`;

export default MedicalFile;
