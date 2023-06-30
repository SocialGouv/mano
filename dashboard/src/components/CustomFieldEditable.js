import { useState, useMemo, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { CANCEL, DONE, TODO } from '../recoil/actions';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import { consultationsState, defaultConsultationFields, prepareConsultationForEncryption } from '../recoil/consultations';
import API from '../services/api';
import { dateForDatePicker, dayjsInstance } from '../services/date';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import CustomFieldInput from './CustomFieldInput';
import Documents from './Documents';
import { modalConfirmState } from './ModalConfirm';
import SelectAsInput from './SelectAsInput';
import SelectStatus from './SelectStatus';
import { toast } from 'react-toastify';
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from './tailwind/Modal';
import SelectPerson from './SelectPerson';
import { CommentsModule } from './CommentsGeneric';
import SelectTeamMultiple from './SelectTeamMultiple';
import UserName from './UserName';

export default function CustomFieldEditable({ isEditing, field }) {
  return (
    <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
      <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-gray-600'} htmlFor="create-consultation-name">
        Nom (facultatif)
      </label>
      <input
        className="tailwindui"
        id="create-consultation-name"
        name="name"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.currentTarget.value })}
      />
    </div>
  );
}
