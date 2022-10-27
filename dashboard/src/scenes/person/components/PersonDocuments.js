import React, { useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { usersState } from '../../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../../services/date';

const PersonDocuments = ({ person }) => {
  const users = useRecoilValue(usersState);

  return (
    <div>
      <h4 className="mt-2 mb-4">Documents</h4>
      <table className="table table-striped">
        <tbody className="small">
          {(person.documents || []).map((doc) => (
            <tr key={doc.id}>
              <td>
                <div>
                  <b>{doc.name}</b>
                </div>
                <div>{formatDateTimeWithNameOfDay(doc.createdAt)}</div>
                <div className="small">Créé par {users.find((e) => e._id === doc.createdBy)?.name}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PersonDocuments;
