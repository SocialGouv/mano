import React from 'react';
import styled from 'styled-components';
import { ActivityIndicator, Animated, StatusBar, StyleSheet, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { MyText } from './MyText';
import colors from '../utils/colors';
import ArrowLeftExtended from '../icons/ArrowLeftExtended';

const hitSlop = {
  top: 20,
  left: 20,
  bottom: 20,
  right: 20,
};

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const ScreenTitle = ({
  title,
  onBack,
  onAdd,
  onEdit,
  onSave,
  onPressRight,
  customRight,
  backgroundColor = colors.app.color,
  color = '#FFF',
  saving,
  children,
  parentScroll,
  testID = '',
  forceTop = false,
}) => {
  const showRightButton = Boolean(onAdd) || Boolean(onEdit) || Boolean(onSave);
  const showLeftButton = showRightButton || Boolean(onBack);

  return (
    <>
      <AnimatedSafeAreaView style={[styles.color(backgroundColor), styles.wrapper(parentScroll, forceTop)]}>
        <StatusBar backgroundColor={backgroundColor} />
        <Animated.View style={[styles.color(backgroundColor), styles.container(forceTop)]}>
          <Animated.View style={styles.titleContainer(parentScroll, forceTop)}>
            {!forceTop && <Animated.View style={[styles.buttonsContainer]} />}
            <Animated.View style={styles.titleCaptionContainer}>
              <Title heavy ellipsizeMode="tail" color={color}>
                {title}
              </Title>
              {Boolean(onPressRight) && (
                <TouchableOpacity hitSlop={hitSlop} onPress={onPressRight}>
                  <ButtonText>{customRight}</ButtonText>
                </TouchableOpacity>
              )}
            </Animated.View>
          </Animated.View>
          <View style={[styles.buttonsContainer, styles.buttonsContainerFixed]}>
            {!!showLeftButton && (
              <Animated.View style={styles.buttonContainer(Boolean(onBack))} pointerEvents={onBack ? 'auto' : 'none'}>
                <TouchableOpacity hitSlop={hitSlop} onPress={onBack} testID={`${testID}-back-button`}>
                  <ArrowLeftExtended color="#fff" size={20} />
                </TouchableOpacity>
              </Animated.View>
            )}
            {!!showLeftButton && (
              <Animated.View style={styles.buttonContainer(Boolean(onBack))} pointerEvents={onBack ? 'auto' : 'none'}>
                {Boolean(onAdd) && (
                  <TouchableOpacity hitSlop={hitSlop} onPress={onAdd}>
                    <ButtonText>Créer</ButtonText>
                  </TouchableOpacity>
                )}
                {Boolean(onEdit) &&
                  (saving ? (
                    <ActivityIndicator size="small" color={color} />
                  ) : (
                    <TouchableOpacity hitSlop={hitSlop} onPress={onEdit}>
                      <ButtonText>Modifier</ButtonText>
                    </TouchableOpacity>
                  ))}
                {Boolean(onSave) &&
                  (saving ? (
                    <ActivityIndicator size="small" color={color} />
                  ) : (
                    <TouchableOpacity hitSlop={hitSlop} onPress={onSave}>
                      <ButtonText>Enregistrer</ButtonText>
                    </TouchableOpacity>
                  ))}
              </Animated.View>
            )}
          </View>
        </Animated.View>
        {children}
      </AnimatedSafeAreaView>
    </>
  );
};

const Title = styled(MyText)`
  font-size: 25px;
  color: ${(props) => props.color};
`;

const ButtonText = styled(MyText)`
  color: #ffffff;
`;

const styles = StyleSheet.create({
  wrapper: (parentScroll, forceTop) => ({
    overflow: 'visible',
    zIndex: 100,
    marginTop: forceTop ? 0 : parentScroll?.interpolate ? -90 : 0,
    transform: [
      {
        translateY: forceTop
          ? 0
          : parentScroll?.interpolate
          ? parentScroll.interpolate({
              inputRange: [0, 100],
              outputRange: [90, 0],
              extrapolate: 'clamp',
            })
          : 0,
      },
    ],
  }),
  titleContainer: (parentScroll, forceTop) => ({
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    transform: [
      {
        translateY: forceTop
          ? 0
          : parentScroll?.interpolate
          ? parentScroll.interpolate({
              inputRange: [0, 100],
              outputRange: [0, -90],
              extrapolate: 'clamp',
            })
          : 0,
      },
    ],
  }),
  color: (backgroundColor) => ({
    backgroundColor,
  }),
  container: (forceTop) => ({
    paddingHorizontal: 15,
    paddingTop: forceTop ? 0 : '5%',
    paddingBottom: forceTop ? 0 : '5%',
  }),
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: 30,
    width: '100%',
  },
  buttonsContainerFixed: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    borderWidth: 0,
  },

  buttonContainer: (show) => ({
    minWidth: 30,
    opacity: show ? 1 : 0,
  }),

  titleCaptionContainer: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 0,
    width: '100%',
    flexDirection: 'row',
  },
});

export default ScreenTitle;
