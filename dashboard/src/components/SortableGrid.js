import React, { useEffect, useRef, useCallback, useState } from 'react';
import styled from 'styled-components';
import Sortable from 'sortablejs';
import { theme } from '../config';
import { Col, FormGroup, Input, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { Formik } from 'formik';
import ButtonCustom from './ButtonCustom';

const SortableGrid = ({ list, onUpdateList, onRemoveItem, onEditItem, editItemTitle }) => {
  const gridRef = useRef(null);
  const sortableJsRef = useRef(null);
  const [contentToEdit, setContentToEdit] = useState(null);

  const onListChange = useCallback(() => {
    onUpdateList([...gridRef.current.children].map((i) => i.dataset.content));
  }, [onUpdateList]);

  useEffect(() => {
    sortableJsRef.current = new Sortable(gridRef.current, {
      animation: 150,
      onEnd: onListChange,
    });
  }, [onListChange]);

  return (
    <>
      <SortableContainer ref={gridRef}>
        {list.map((content) => (
          <Item key={content} data-content={content} className="grid-square">
            <span>{content}</span>
            <button onClick={() => setContentToEdit(content)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button onClick={() => onRemoveItem(content)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Item>
        ))}
      </SortableContainer>
      <EditContent open={!!contentToEdit} setOpen={setContentToEdit} onSubmit={onEditItem} content={contentToEdit} title={editItemTitle} />
    </>
  );
};

const EditContent = ({ open, setOpen, onSubmit, content, title }) => {
  return (
    <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
      <ModalHeader toggle={() => setOpen(false)}>{title}</ModalHeader>
      <ModalBody>
        <Formik
          initialValues={{ content, newContent: '' }}
          onSubmit={async (body, actions) => {
            await onSubmit(body);
            actions.setSubmitting(false);
            setOpen(null);
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <div>Ancien nom</div>
                    <Input name="content" value={values.content} onChange={handleChange} disabled />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <div>Nouveau nom</div>
                    <Input name="newContent" value={values.newContent} onChange={handleChange} />
                  </FormGroup>
                </Col>
              </Row>
              <br />
              <ButtonCustom loading={isSubmitting} color="info" onClick={handleSubmit} title="Enregistrer" />
            </React.Fragment>
          )}
        </Formik>
      </ModalBody>
    </Modal>
  );
};

const SortableContainer = styled.div`
  max-width: 100%;
  box-sizing: border-box;
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
`;

const Item = styled.div`
  background-color: rgb(255, 255, 255);
  color: rgb(33, 37, 41);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.25rem;
  width: 12.5rem;
  height: 3.5rem;
  position: relative;
  cursor: move;
  span {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background-color: ${theme.main}22;
    padding: 0.25rem;
    text-align: center;
  }
  button {
    display: none;
    border: none;
    position: absolute;
    top: 5px;
    padding: 0;
    margin: 0;
    width: 1rem;
    height: 1rem;
    background: none;
    line-height: 1rem;
  }
  button:first-of-type {
    left: 5px;
  }
  button:last-of-type {
    right: 5px;
  }
  svg {
    line-height: 1rem;
    width: 1rem;
    height: 1rem;
  }
  &:hover button {
    display: block;
  }
`;

export default SortableGrid;
