import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';

const RowContainer = ({
  Component = TouchableOpacity,
  onPress,
  disabled,
  noPadding,
  children,
  center,
}) => {
  return (
    <Component onPress={onPress} disabled={disabled}>
      <View style={styles.container}>
        <View style={[styles.subContainer, noPadding && styles.noPadding, center && styles.center]}>
          {children}
        </View>
      </View>
    </Component>
  );
};

// seems to be a problem with the nested shadow-offset and styled-components
// switching temporarily to stylesheet for this
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#f4f5f8',
    marginHorizontal: 10,
    marginBottom: 10,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 3 },
    // shadowRadius: 5,
    // shadowOpacity: 0.55,
    // elevation: 10,
  },
  subContainer: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  noPadding: {
    padding: 0,
  },
  center: {
    justifyContent: 'center',
  },
});

export default RowContainer;
