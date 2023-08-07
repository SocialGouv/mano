import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';

const RowContainer = ({ onPress, noPadding, children }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.container}>
        <View style={[styles.subContainer, noPadding && styles.noPadding]}>{children}</View>
      </View>
    </TouchableOpacity>
  );
};

// seems to be a problem with the nested shadow-offset and styled-components
// switching temporarily to stylesheet for this
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: 'white',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    shadowOpacity: 0.55,
    elevation: 10,
  },
  subContainer: {
    padding: 15,
    alignItems: 'center',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    flexDirection: 'row',
    width: '100%',
  },
  noPadding: {
    padding: 0,
  },
});

export default RowContainer;
