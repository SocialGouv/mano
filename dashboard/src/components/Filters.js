/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import styled from 'styled-components';
import { Col, Row, Input } from 'reactstrap';
import SelectCustom from './SelectCustom';
import DatePicker from 'react-datepicker';

export const filterData = (data, filters) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) {
    for (let filter of filters) {
      if (!filter.field || !filter.value) continue;
      data = data
        .map((item) => {
          const itemValue = item[filter.field];
          if (!itemValue || [null, undefined].includes(itemValue)) return filter.value === 'Non renseigné' ? item : null;
          if (typeof itemValue === 'boolean') {
            return itemValue === (filter.value === 'Oui') ? item : null;
          }

          if (typeof itemValue === 'string') {
            if (
              filter.type === 'text' &&
              (itemValue || '')
                .trim()
                .toLowerCase()
                .includes((filter.value || '').trim().toLowerCase())
            )
              return item;
            if (itemValue === filter.value) return item;
            return null;
          }
          // type is array
          if (!itemValue.length && filter.value === 'Non renseigné') return item;
          if (itemValue.includes(filter.value)) {
            let newValues = itemValue.filter((value) => value !== filter.value);
            if (!newValues.length) newValues = ['Uniquement'];
            return {
              ...item,
              [filter.field]: newValues,
            };
          }
          return null;
        })
        .filter(Boolean);
    }
  }
  console.log(data);
  return data;
};

const Filters = ({ onChange, base, filters, title = 'Filtres :' }) => {
  filters = !!filters.length ? filters : [{}];
  const onAddFilter = () => onChange([...filters, {}]);

  return (
    <Container>
      <Subcontainer>
        <Row>
          <Col md={10}>
            <Title>{title}</Title>
          </Col>
          <Col md={2}>
            <AddButton onClick={onAddFilter}>Ajouter</AddButton>
          </Col>
        </Row>
        {filters.map(({ field, value }, index) => {
          const filterFields = base.map((filter) => filter.field);
          const filterValues = !!field ? [...(base.find((filter) => filter.field === field)?.options || []), 'Non renseigné'] : [];
          const { type } = base.find((filter) => filter.field === field) || {};

          const onChangeField = (newField) => onChange(filters.map((f, i) => (i === index ? { field: newField, value: null, type } : f)));
          const onChangeValue = (newValue) => onChange(filters.map((f, i) => (i === index ? { field, value: newValue, type } : f)));
          const onRemoveFilter = () => onChange(filters.filter((f, i) => i !== index));

          return (
            <Row style={{ marginBottom: 10 }} key={field}>
              <Col md={4}>
                <SelectCustom
                  options={filterFields}
                  value={[field]}
                  onChange={onChangeField}
                  getOptionLabel={(f) => base.find((filter) => filter.field === f)?.label}
                  getOptionValue={(f) => f}
                  isClearable={true}
                  isMulti={false}
                />
              </Col>
              <Col md={4}>
                <ValueSelector field={field} filterValues={filterValues} value={value} base={base} onChangeValue={onChangeValue} />
              </Col>
              <Col md={2}>{!!filters.filter((f) => Boolean(f.field)).length && <DeleteButton onClick={onRemoveFilter}>Retirer</DeleteButton>}</Col>
            </Row>
          );
        })}
      </Subcontainer>
    </Container>
  );
};

function ValueSelector({ field, filterValues, value, onChangeValue, base }) {
  if (!field) return <></>;
  const { type, field: name } = base.find((filter) => filter.field === field);

  if (['text', 'number', 'textarea'].includes(type)) {
    return (
      <Input
        name={name}
        type={type === 'textarea' ? 'text' : type}
        value={value || ''}
        onChange={(e) => {
          e.preventDefault();
          onChangeValue(e.target.value);
        }}
      />
    );
  }

  if (['date-with-time', 'date'].includes(type)) {
    return (
      <Row>
        <Col sm={6}>
          <SelectCustom options={['before', 'after']} getOptionLabel={(f) => f} getOptionValue={(f) => f} isClearable={!value} />
        </Col>
        <Col sm={6}>
          <DatePicker className="form-control" name={name} selected={value} onChange={(date) => onChangeValue(date)} />
        </Col>
      </Row>
    );
  }

  return (
    <SelectCustom
      options={filterValues}
      value={[value]}
      getOptionLabel={(f) => f}
      getOptionValue={(f) => f}
      onChange={onChangeValue}
      isClearable={!value}
    />
  );
}

const Title = styled.span`
  display: block;
`;

const Container = styled.div`
  align-self: center;
  /* margin: 15px; */
  padding-bottom: 15px;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #ddd;
`;

const Subcontainer = styled.div`
  width: 100%;
`;

const AddOrDeleteFilterButton = styled.button`
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid rgb(204, 204, 204);
  color: red;
`;

const AddButton = styled(AddOrDeleteFilterButton)`
  color: green;
`;

const DeleteButton = styled(AddOrDeleteFilterButton)`
  color: red;
`;

export default Filters;
