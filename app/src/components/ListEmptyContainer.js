import React from 'react';
import styled from 'styled-components';
import { MyText } from './MyText';

const ListEmptyContainer = ({ text, opaque }) => (
  <Container>
    <Caption opaque={opaque}>{text}</Caption>
  </Container>
);

export const ListEmptyActions = () => <ListEmptyContainer text="Il n'y a pas d'action à afficher" />;
export const ListEmptyPersons = () => <ListEmptyContainer text="Il n'y a pas de personne à afficher" />;
export const ListEmptyStructures = () => <ListEmptyContainer text="Il n'y a pas de structure à afficher" />;
export const ListEmptyTerritories = () => <ListEmptyContainer text="Il n'y a pas de territoire à afficher" />;
export const ListEmptyStructureWithName = (name) => () => <ListEmptyContainer text={`Il n'y a pas de structure incluant ${name}`} />;
export const ListEmptyPlaceWithName = (name) => () => <ListEmptyContainer text={`Il n'y a pas de lieu incluant ${name}`} />;

export const ListNoMoreActions = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre action à afficher" />;
export const ListNoMorePersons = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre personne à afficher" />;
export const ListNoMoreStructures = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre structure à afficher" />;
export const ListNoMoreTerritories = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre territoire à afficher" />;

const Container = styled.View`
  flex: 1;
  height: 100%;
  justify-content: center;
`;

const Caption = styled(MyText)`
  font-weight: bold;
  text-align: center;
  margin-vertical: 20px;
  ${(props) => props.opaque && 'opacity: 0.5;'}
`;
