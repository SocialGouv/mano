import React from 'react';
import { Col, Row, Modal, ModalBody } from 'reactstrap';
import { atom, useRecoilState } from 'recoil';

import ButtonCustom from './ButtonCustom';

const closedState = {
  open: false,
  options: {
    title: 'Voulez-vous enregistrer cet élément ?',
    subTitle: '',
    buttons: [
      {
        text: 'Enregistrer',
        onClick: async () => console.log('onClick'),
      },
      {
        text: 'Ne pas enregistrer',
        onClick: async () => console.log('onBack'),
        style: 'danger', // available styles: primary | secondary | cancel | danger | warning
      },
      {
        text: 'Annuler',
        style: 'link',
        onClick: async () => console.log('cancel'),
      },
    ],
  },
};

export const modalConfirmState = atom({
  key: 'modalConfirmState',
  default: closedState,
});

const ModalConfirm = () => {
  const [
    {
      open,
      options: { title, subTitle, buttons },
    },
    setModalConfirmState,
  ] = useRecoilState(modalConfirmState);

  const close = () => setModalConfirmState((prevState) => ({ ...prevState, open: false }));

  return (
    <Modal isOpen={open} toggle={close} size="sm" centered onClosed={() => setModalConfirmState(closedState)} backdrop="static">
      <ModalBody>
        <Row>
          <Col md={12}>{title}</Col>
          {!!subTitle && <Col md={12}>{subTitle}</Col>}
        </Row>
        <br />
        <Row>
          {buttons.map(({ text, onClick, style }, index) => (
            <Col md={12 / buttons.length} key={index + text + style + open}>
              <ButtonCustom
                color={style}
                onClick={async () => {
                  onClick?.();
                  close();
                }}
                title={text}
              />
            </Col>
          ))}
        </Row>
      </ModalBody>
    </Modal>
  );
};

export default ModalConfirm;
