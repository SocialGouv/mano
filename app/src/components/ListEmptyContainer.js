import React from 'react';
import styled from 'styled-components';

const ListEmptyContainer = ({ text, opaque }) => (
  <Container>
    <Text opaque={opaque}>{text}</Text>
  </Container>
);

export const ListEmptyActions = () => (
  <ListEmptyContainer text="Il n'y a pas d'action à afficher" />
);
export const ListEmptyPersons = () => (
  <ListEmptyContainer text="Il n'y a pas d'usager à afficher" />
);
export const ListEmptyStructures = () => (
  <ListEmptyContainer text="Il n'y a pas de structure à afficher" />
);
export const ListEmptyStructureWithName = (name) => () => (
  <ListEmptyContainer text={`Il n'y a pas de structure incluant ${name}`} />
);
export const ListEmptyPlaceWithName = (name) => () => (
  <ListEmptyContainer text={`Il n'y a pas de lieu incluant ${name}`} />
);

export const ListNoMoreActions = () => (
  <ListEmptyContainer opaque text="Il n'y a pas d'autre action à afficher" />
);
export const ListNoMorePersons = () => (
  <ListEmptyContainer opaque text="Il n'y a pas d'autre usager à afficher" />
);
export const ListNoMoreStructures = () => (
  <ListEmptyContainer opaque text="Il n'y a pas d'autre structure à afficher" />
);

const Container = styled.View`
  flex: 1;
  height: 100%;
  justify-content: center;
`;

const Text = styled.Text`
  font-weight: bold;
  text-align: center;
  margin-vertical: 20px;
  ${(props) => props.opaque && 'opacity: 0.5;'}
`;
