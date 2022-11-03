import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useRecoilState, useRecoilValue } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import Button from '../../components/Button';
import InputLabelled from '../../components/InputLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import SubList from '../../components/SubList';
import DateAndTimeInput, { displayBirthDate } from '../../components/DateAndTimeInput';
import GenderSelect from '../../components/Selects/GenderSelect';
import colors from '../../utils/colors';
import { currentTeamState, organisationState } from '../../recoil/auth';
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
import { MyText } from '../../components/MyText';

const MedicalFile = ({ navigation, person, personDB, onUpdatePerson, updating, editable, onEdit, isUpdateDisabled, backgroundColor, onChange }) => {
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const allConsultations = useRecoilValue(consultationsState);
  const allTreatments = useRecoilValue(treatmentsState);
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
  }, [consultations, medicalFile, treatments]);

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
    setMedicalFile(response.decryptedData);
    await onUpdatePerson();
  };

  const onGoToConsultation = (consultationDB) => navigation.navigate('Consultation', { personDB, consultationDB });
  const onGoToTreatment = (treatmentDB) => navigation.navigate('Treatment', { personDB, treatmentDB });

  const onAddDocument = async (doc) => {
    const body = prepareMedicalFileForEncryption(customFieldsMedicalFile)({
      ...medicalFile,
      documents: [...(medicalFile.documents || []), doc],
    });
    const medicalFileResponse = await API.put({ path: `/medical-file/${medicalFile._id}`, body });

    if (medicalFileResponse.ok) {
      setAllMedicalFiles((medicalFiles) =>
        medicalFiles.map((m) => {
          if (m._id === medicalFileDB._id) return medicalFileResponse.decryptedData;
          return m;
        })
      );
      setMedicalFile(medicalFileResponse.decryptedData);
    }
  };

  return (
    <ScrollContainer ref={scrollViewRef} backgroundColor={backgroundColor || colors.app.color} testID="person-summary">
      <BackButton onPress={navigation.goBack}>
        <MyText color={colors.app.color}>{'<'} Retour vers la personne</MyText>
      </BackButton>
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
        .filter((f) => f.enabled || f.enabledTeams.includes(currentTeam._id))
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
        onAdd={() => onGoToTreatment()}
        data={treatments}
        renderItem={(treatment) => <TreatmentRow treatment={treatment} key={treatment._id} onTreatmentPress={onGoToTreatment} />}
        ifEmpty="Pas encore de traitement"
      />
      <SubList
        label="Consultations"
        onAdd={() => onGoToConsultation()}
        testID="person-consultations-list"
        data={consultations}
        renderItem={(consultation) => <ConsultationRow consultation={consultation} key={consultation._id} onConsultationPress={onGoToConsultation} />}
        ifEmpty="Pas encore de consultation"
      />
      <SubList
        label="Documents médicaux"
        data={allMedicalDocuments}
        renderItem={(medicalDocument) => (
          <DocumentRow key={medicalDocument.name}>
            <Document document={medicalDocument} personId={personDB._id} />
          </DocumentRow>
        )}
        ifEmpty="Pas encore de document médical">
        <DocumentsManager personDB={personDB} onAddDocument={onAddDocument} />
      </SubList>
    </ScrollContainer>
  );
};

const DocumentRow = styled.View`
  margin-horizontal: 30px;
`;

const BackButton = styled.TouchableOpacity`
  margin-right: auto;
  margin-bottom: 25px;
`;

export default MedicalFile;
