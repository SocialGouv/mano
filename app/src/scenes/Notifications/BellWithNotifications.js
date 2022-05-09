import React from 'react';
import { selector, useRecoilValue } from 'recoil';
import BellIcon from '../../icons/BellIcon';
import { urgentItemsSelector } from './Notifications';

export const notificationsNumberSelector = selector({
  key: 'notificationsNumberSelector',
  get: ({ get }) => {
    const { actionsFiltered, commentsFiltered } = get(urgentItemsSelector);

    return actionsFiltered?.length + commentsFiltered?.length;
  },
});

const BellWithNotifications = ({ color, size }) => {
  const notificationsNumber = useRecoilValue(notificationsNumberSelector);
  return <BellIcon color={color} size={size} notificationsNumber={notificationsNumber} />;
};

export default BellWithNotifications;
