import React from 'react';
import SubHeader from '../../components/SubHeader';
import colors from '../../utils/colors';
import DocumentsManager from '../../components/DocumentsManager';
import ScrollContainer from '../../components/ScrollContainer';

const Documents = ({ personDB, navigation, onUpdatePerson, backgroundColor }) => {
  return (
    <>
      <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Documents" />
      <ScrollContainer backgroundColor={backgroundColor || colors.app.color}>
        <DocumentsManager
          onAddDocument={(document) =>
            onUpdatePerson(true, {
              documents: [...(personDB.documents || []), document],
            })
          }
          personDB={personDB}
          documents={personDB?.documents}
          backgroundColor={backgroundColor || colors.app.color}
        />
      </ScrollContainer>
    </>
  );
};

export default Documents;
