import React from 'react';
import styled, { css } from 'styled-components';
import ButtonRight from './ButtonRight';
import RowContainer from './RowContainer';
import { MyText } from './MyText';
import { ActivityIndicator, View } from 'react-native';
import colors from '../utils/colors';

const Row = ({ loading, onPress, caption, withNextButton, center, onBack, testID, color = '#000' }) => (
  <RowContainer onPress={onPress} center={center || loading} disabled={loading} onBack={onBack} testID={testID}>
    {Boolean(onBack) && <ButtonRight onPress={onPress} caption="<" />}
    <Caption loading={loading} as={loading ? View : MyText} color={color}>
      {loading ? <ActivityIndicator size="small" color={colors.app.secondary} /> : caption}
    </Caption>
    {withNextButton && <ButtonRight onPress={onPress} caption=">" />}
  </RowContainer>
);

const loaderCss = css`
  align-self: center;
  justify-content: center;
  flex-grow: 1;
  text-align: center;
`;

const Caption = styled(MyText)`
  margin-left: 15px;
  font-size: 20px;
  font-weight: bold;
  ${(props) => props.loading && loaderCss}
  color: ${(props) => props.color};
`;

export default Row;
