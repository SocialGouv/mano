import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import ScrollContainer from '../../components/ScrollContainer';
import Button from '../../components/Button';
import InputLabelled from '../../components/InputLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import SubList from '../../components/SubList';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import GenderSelect from '../../components/Selects/GenderSelect';
import colors from '../../utils/colors';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { consultationsState } from '../../recoil/consultations';
import { treatmentsState } from '../../recoil/treatments';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../recoil/medicalFiles';
import API from '../../services/api';
import HealthInsuranceMultiCheckBox from '../../components/Selects/HealthInsuranceMultiCheckBox';
import CustomFieldInput from '../../components/CustomFieldInput';
import ConsultationRow from '../../components/ConsultationRow';
import TreatmentRow from '../../components/TreatmentRow';
import Document from '../../components/Document';
import DocumentsManager from '../../components/DocumentsManager';
import { MyText } from '../../components/MyText';
import { flattenedCustomFieldsPersonsSelector } from '../../recoil/persons';
import CommentRow from '../Comments/CommentRow';
import NewCommentInput from '../Comments/NewCommentInput';
import { Alert } from 'react-native';
import { formatBirthDateAndAge } from '../../services/dateDayjs';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';

const MedicalFile = ({ navigation, person, personDB, onUpdatePerson, updating, editable, onEdit, isUpdateDisabled, backgroundColor, onChange }) => {
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);

  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);

  const allConsultations = useRecoilValue(consultationsState);
  const allTreatments = useRecoilValue(treatmentsState);
  const setAllMedicalFiles = useSetRecoilState(medicalFileState);

  const consultations = useMemo(
    () =>
      (allConsultations || [])
        .filter((c) => c.person === personDB?._id)
        .sort((p1, p2) => ((p1.completedAt || p1.dueAt) > (p2.completedAt || p2.dueAt) ? -1 : 1)),
    [allConsultations, personDB?._id]
  );

  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === personDB?._id), [allTreatments, personDB?._id]);

  const populatedPersons = useRecoilValue(itemsGroupedByPersonSelector);
  const populatedPerson = useMemo(() => populatedPersons[personDB?._id] || {}, [populatedPersons, personDB?._id]);

  const medicalFileDB = populatedPerson.medicalFile;
  const [medicalFile, setMedicalFile] = useState(populatedPerson.medicalFile);
  const [writingComment, setWritingComment] = useState('');

  useEffect(() => {
    if (!medicalFileDB) {
      (async () => {
        const response = await API.post({
          path: '/medical-file',
          body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ person: personDB?._id, documents: [], organisation: organisation._id }),
        });
        if (!response.ok) return;
        setAllMedicalFiles((medicalFiles) => [...medicalFiles, response.decryptedData]);
        setMedicalFile(response.decryptedData);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalFileDB]);

  const backRequestHandledRef = useRef(null);
  const handleBeforeRemove = (e) => {
    if (backRequestHandledRef.current === true) return;
    e.preventDefault();
    onGoBackRequested();
  };
  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
  };
  useEffect(() => {
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMedicalDocuments = useMemo(() => {
    const ordonnances =
      treatments
        ?.map((treatment) => treatment.documents?.map((doc) => ({ ...doc, type: 'treatment', treatment })))
        .filter(Boolean)
        .flat() || [];
    const consultationsDocs =
      consultations
        ?.filter((consultation) => {
          if (!consultation?.onlyVisibleBy?.length) return true;
          return consultation.onlyVisibleBy.includes(user._id);
        })
        .map((consultation) => consultation.documents?.map((doc) => ({ ...doc, type: 'consultation', consultation })))
        .filter(Boolean)

        .flat() || [];
    const otherDocs = medicalFile?.documents || [];
    return [...ordonnances, ...consultationsDocs, ...otherDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [consultations, medicalFile, treatments, user._id]);

  const allMedicalComments = useMemo(() => {
    const treatmentsComments =
      treatments
        ?.map((treatment) => treatment.comments?.map((doc) => ({ ...doc, type: 'treatment', treatment })))
        .filter(Boolean)
        .flat() || [];
    const consultationsComments =
      consultations
        ?.filter((consultation) => {
          if (!consultation?.onlyVisibleBy?.length) return true;
          return consultation.onlyVisibleBy.includes(user._id);
        })
        .map((consultation) => consultation.comments?.map((doc) => ({ ...doc, type: 'consultation', consultation })))
        .filter(Boolean)
        .flat() || [];
    const otherComments = medicalFile?.comments || [];
    return [...treatmentsComments, ...consultationsComments, ...otherComments].sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
  }, [consultations, medicalFile, treatments, user]);

  const scrollViewRef = useRef(null);
  const newCommentRef = useRef(null);
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

  const onGoBackRequested = async () => {
    if (writingComment.length) {
      const goToNextStep = await new Promise((res) =>
        Alert.alert("Vous êtes en train d'écrire un commentaire, n'oubliez pas de cliquer sur créer !", null, [
          {
            text: "Oui c'est vrai !",
            onPress: () => res(false),
          },
          {
            text: 'Ne pas enregistrer ce commentaire',
            onPress: () => res(true),
            style: 'destructive',
          },
          {
            text: 'Annuler',
            onPress: () => res(false),
            style: 'cancel',
          },
        ])
      );
      if (!goToNextStep) return;
    }
    if (isMedicalFileUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const response = await onGoBackRequested();
          if (response.ok) onBack();
        },
      },
      {
        text: 'Ne pas enregistrer',
        onPress: onBack,
        style: 'destructive',
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onUpdateRequest = async (latestMedicalFile) => {
    if (!latestMedicalFile) latestMedicalFile = medicalFile;

    const historyEntry = {
      date: new Date(),
      user: user._id,
      data: {},
    };
    for (const key in latestMedicalFile) {
      if (!customFieldsMedicalFile.map((field) => field.name).includes(key)) continue;
      if (latestMedicalFile[key] !== medicalFileDB[key]) {
        historyEntry.data[key] = { oldValue: medicalFileDB[key], newValue: latestMedicalFile[key] };
      }
    }
    if (!!Object.keys(historyEntry.data).length) latestMedicalFile.history = [...(medicalFileDB.history || []), historyEntry];

    const response = await API.put({
      path: `/medical-file/${medicalFileDB._id}`,
      body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ ...medicalFileDB, ...latestMedicalFile }),
    });
    if (!response.ok) return;
    setAllMedicalFiles((medicalFiles) =>
      medicalFiles.map((m) => {
        if (m._id === medicalFileDB._id) return response.decryptedData;
        return m;
      })
    );
    setMedicalFile(response.decryptedData);
    const personResponse = await onUpdatePerson();
    if (!personResponse.ok) return false;
    return true;
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

  const onDelete = async (doc) => {
    const body = prepareMedicalFileForEncryption(customFieldsMedicalFile)({
      ...medicalFile,
      documents: medicalFile.documents.filter((d) => d.file.filename !== doc.file.filename),
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
      <BackButton onPress={onGoBackRequested}>
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
        <InputLabelled label="Âge" value={formatBirthDateAndAge(person.birthdate)} placeholder="JJ-MM-AAAA" editable={false} />
      )}
      {/* These custom fields are displayed by default, because they where displayed before they became custom fields */}
      {Boolean(flattenedCustomFieldsPersons.find((e) => e.name === 'healthInsurances')) && (
        <HealthInsuranceMultiCheckBox
          values={person.healthInsurances}
          onChange={(healthInsurances) => onChange({ healthInsurances })}
          editable={editable}
        />
      )}
      {Boolean(flattenedCustomFieldsPersons.find((e) => e.name === 'structureMedical')) && (
        <InputLabelled
          label="Structure de suivi médical"
          onChangeText={(structureMedical) => onChange({ structureMedical })}
          value={person.structureMedical || (editable ? null : '-- Non renseignée --')}
          placeholder="Renseignez la structure médicale le cas échéant"
          editable={editable}
        />
      )}
      {customFieldsMedicalFile
        .filter((f) => f)
        .filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
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
          onPress={() => (editable ? onUpdateRequest() : onEdit())}
          disabled={editable ? isUpdateDisabled && isMedicalFileUpdateDisabled : false}
          loading={updating}
        />
      </ButtonsContainer>
      <SubList
        label="Commentaires"
        key={medicalFileDB?._id + allMedicalComments.length}
        data={allMedicalComments}
        renderItem={(comment) => (
          <CommentRow
            key={comment._id}
            comment={comment}
            itemName={
              ['consultation', 'treatment'].includes(comment.type) ? `${comment.type === 'consultation' ? 'Consultation' : 'Traitement'}` : null
            }
            onItemNamePress={
              ['consultation', 'treatment'].includes(comment.type)
                ? () => (comment.type === 'consultation' ? onGoToConsultation(comment.consultation) : onGoToTreatment(comment.treatment))
                : null
            }
            onDelete={
              comment.type === 'medical-file'
                ? async () => {
                    const medicalFileToSave = {
                      ...medicalFile,
                      comments: medicalFile.comments.filter((c) => c._id !== comment._id),
                    };
                    setMedicalFile(medicalFileToSave); // optimistic UI
                    // need to pass `medicalFileToSave` if we want last comment to be taken into account
                    // https://react.dev/reference/react/useState#ive-updated-the-state-but-logging-gives-me-the-old-value
                    const success = await onUpdateRequest(medicalFileToSave);
                    return success;
                  }
                : null
            }
            onUpdate={
              comment.type === 'medical-file'
                ? async (commentUpdated) => {
                    const medicalFileToSave = {
                      ...medicalFile,
                      comments: medicalFile.comments.map((c) => (c._id === comment._id ? commentUpdated : c)),
                    };
                    setMedicalFile(medicalFileToSave); // optimistic UI
                    // need to pass `medicalFileToSave` if we want last comment to be taken into account
                    // https://react.dev/reference/react/useState#ive-updated-the-state-but-logging-gives-me-the-old-value
                    const success = await onUpdateRequest(medicalFileToSave);
                    return success;
                  }
                : null
            }
          />
        )}
        ifEmpty="Pas encore de commentaire">
        <NewCommentInput
          forwardRef={newCommentRef}
          onFocus={() => _scrollToInput(newCommentRef)}
          onCommentWrite={setWritingComment}
          onCreate={(newComment) => {
            const newComments = [{ ...newComment, type: 'medical-file', _id: uuidv4() }, ...(medicalFile.comments || [])];
            const medicalFileToSave = { ...medicalFile, comments: newComments };
            setMedicalFile(medicalFileToSave); // optimistic UI
            // need to pass comments as parameters if we want last comment to be taken into account
            // https://react.dev/reference/react/useState#ive-updated-the-state-but-logging-gives-me-the-old-value
            onUpdateRequest(medicalFileToSave);
          }}
        />
      </SubList>
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
            <Document document={medicalDocument} personId={personDB?._id} />
          </DocumentRow>
        )}
        ifEmpty="Pas encore de document médical">
        <DocumentsManager personDB={personDB} onAddDocument={onAddDocument} onDelete={onDelete} />
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
