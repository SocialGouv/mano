import React from 'react';
import styled from 'styled-components';
import { TouchableWithoutFeedback } from 'react-native';
import Label from './Label';
import InputMultilineAutoAdjust from './InputMultilineAutoAdjust';
import { MyText, MyTextInput } from './MyText';
import colors from '../utils/colors';
import Button from './Button';
import Spacer from './Spacer';

const InputLabelled = React.forwardRef(
  (
    {
      error,
      label,
      multiline,
      editable = true,
      onClear,
      noMargin,
      EndIcon,
      onEndIconPress,
      buttonCaption,
      buttonValue,
      buttonColor,
      buttonBg,
      onButtonPress,
      ...props
    },
    ref
  ) => {
    if (!editable) {
      const value = String(props.value || '')
        .split('\\n')
        .join('\u000A');
      return (
        <FieldContainer noMargin={noMargin}>
          {!!label && <InlineLabel bold>{`${label} : `}</InlineLabel>}
          <Row>
            <Content ref={ref}>{value}</Content>
            <Spacer grow />
            {!!buttonCaption && (
              <Button
                onPress={() => onButtonPress(buttonValue)}
                caption={buttonCaption}
                backgroundColor={buttonBg}
                color={buttonColor}
                buttonSize={20}
              />
            )}
          </Row>
        </FieldContainer>
      );
    }
    return (
      <InputContainer>
        {label && <Label label={label} />}
        {multiline ? <InputMultilineAutoAdjust ref={ref} {...props} /> : <Input ref={ref} {...props} value={String(props.value)} />}
        {Boolean(EndIcon) && Boolean(props?.value?.length) && (
          <TouchableWithoutFeedback onPress={onEndIconPress}>
            <IconWrapper>
              <EndIcon size={20} color={colors.app.color} />
            </IconWrapper>
          </TouchableWithoutFeedback>
        )}
        {/* {Boolean(onClear) && Boolean(props?.value?.length) && <ButtonReset onPress={onClear} />} */}
        {!!error && <Error>{error}</Error>}
      </InputContainer>
    );
  }
);

const FieldContainer = styled.View`
  flex-grow: 1;
  margin-bottom: ${(props) => (props.noMargin ? 0 : 25)}px;
`;

const InputContainer = styled.View`
  margin-bottom: 30px;
  flex-grow: 1;
`;

const Error = styled(MyText)`
  margin-left: 5px;
  font-size: 14px;
  color: red;
  height: 18px;
`;

const InlineLabel = styled(MyText)`
  font-size: 15px;
  color: ${colors.app.color};
  margin-bottom: 15px;
`;

const Content = styled(MyText)`
  font-size: 17px;
  line-height: 20px;
`;

const Input = styled(MyTextInput)`
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 12px;
  padding-horizontal: 12px;
  padding-vertical: 15px;
`;

const IconWrapper = styled.View`
  position: absolute;
  right: 12px;
  top: 0;
  bottom: 0;
  justify-content: center;
  padding-top: 22px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

export default InputLabelled;
