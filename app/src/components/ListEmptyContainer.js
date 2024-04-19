import React from 'react';
import styled from 'styled-components/native';
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
export const ListEmptyObservations = () => <ListEmptyContainer text="Il n'y a pas d'observation à afficher" />;
export const ListEmptyStructureWithName = (name) => () => <ListEmptyContainer text={`Il n'y a pas de structure incluant ${name}`} />;
export const ListEmptyPlaceWithName = (name) => () => <ListEmptyContainer text={`Il n'y a pas de lieu incluant ${name}`} />;
export const ListEmptyComments = () => <ListEmptyContainer opaque text="Il n'y a pas de commentaire à afficher" />;
export const ListEmptyRencontres = () => <ListEmptyContainer opaque text="Il n'y a pas de rencontre à afficher" />;
export const ListEmptyCollaboration = (collaboration) => () => <ListEmptyContainer text={`Vous n'avez pas encore collaboré avec ${collaboration}`} />;
export const ListEmptyUrgent = () => <ListEmptyContainer opaque text="Il n'y a pas d'élément prioritaire à afficher" />;
export const ListEmptyUrgentAction = () => <ListEmptyContainer opaque text="Il n'y a pas d'action urgente à afficher" />;
export const ListEmptyUrgentComment = () => <ListEmptyContainer opaque text="Il n'y a pas de commentaire urgent à afficher" />;

export const ListNoMoreActions = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre action à afficher" />;
export const ListNoMoreComments = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre commentaire à afficher" />;
export const ListNoMoreRencontres = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre rencontre à afficher" />;
export const ListNoMoreObservations = () => <ListEmptyContainer opaque text="Il n'y a pas d'autre observation de territoire à afficher" />;
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
