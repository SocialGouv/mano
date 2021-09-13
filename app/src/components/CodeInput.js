import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Platform } from 'react-native';
import Spinner from './Spinner';
import { MyText, MyTextInput } from './MyText';

const createRange = (rangeLength) => {
  const range = [];
  for (var i = 0; i < rangeLength; i++) {
    range.push(i);
  }
  return range;
};

const CodeInput = ({ hidden, codeLength, onComplete }) => {
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const range = React.useRef(createRange(codeLength));

  React.useEffect(() => {
    const sendCode = async () => {
      setLoading(true);
      const reset = await onComplete(code);
      if (reset) {
        setLoading(false);
        setCode('');
      }
    };
    if (code.length === codeLength) sendCode();
  }, [code, codeLength, onComplete]);

  if (loading) return <Spinner />;

  return (
    <>
      <Description>Veuillez rentrer le code secret</Description>
      <CodeInputContainer>
        <CodeInputStyled
          keyboardType="numeric"
          autoFocus
          allowFontScaling={false}
          value={code}
          onChangeText={setCode}
          textContentType="password"
          caretHidden
          contextMenuHidden
          disableFullscreenUI
          maxLength={codeLength}
          autoComplete={false}
          autoCorrect={false}
          secureTextEntry={hidden}
          // style props
          codeLength={codeLength}
          hidden={hidden}
        />
        <DotContainer>
          {range.current.map((_, ind) => (
            <DotStyled key={ind} />
          ))}
        </DotContainer>
      </CodeInputContainer>
    </>
  );
};

const Description = styled(MyText)`
  align-self: center;
  max-width: 80%;
  margin-top: 20%;
`;

const CodeInputContainer = styled.View`
  padding-left: 15px;
  padding-right: 15px;
  align-items: center;
  margin: 20px;
  margin-bottom: 50px;
`;

const CodeInputStyled = styled(MyTextInput)`
  text-align: left;
  padding-left: ${Platform.select({ android: 10, ios: 35.4 })}px;
  height: 55px;
  font-size: ${({ hidden }) => Platform.select({ android: hidden ? 30 : 25, ios: 25 })}px;
  letter-spacing: ${({ hidden }) =>
    Platform.select({ android: hidden ? 30 : 25, ios: hidden ? 24 : 26 })}px;
  width: ${({ codeLength }) => codeLength * 25 + (codeLength - 1) * 27}px;
  margin-left: ${Platform.select({ android: 15, ios: -10 })}px;
  ${Platform.OS === 'android' && 'font-family: consolas;'}
`;

const DotContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin: -15px;
  margin-top: -5px;
`;

const DotStyled = styled.View`
  height: 1px;
  max-width: 25px;
  border-bottom-color: #000;
  border-bottom-width: 1px;
  width: 25px;
  margin-left: 15px;
`;

CodeInput.propTypes = {
  hidden: PropTypes.bool,
  onComplete: PropTypes.func.isRequired,
  codeLength: PropTypes.number,
};

CodeInput.defaultProps = {
  hidden: false,
  codeLength: 4,
};

export default CodeInput;
