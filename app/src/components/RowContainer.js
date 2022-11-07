import React from 'react';
import { TouchableOpacity, View } from 'react-native';

const RowContainer = ({ Component = TouchableOpacity, onPress, disabled, noPadding, children, center, testID = '', styles: stylesProps = {} }) => {
  return (
    <Component onPress={onPress} disabled={disabled} testID={testID}>
      <View className="overflow-hidden rounded-2xl bg-[#f4f5f8] mx-2.5 mb-2.5" style={stylesProps?.container}>
        <View
          className={['py-5 px-3 items-center flex-row w-full', noPadding && 'p-0', center && 'justify-center'].join(' ')}
          style={stylesProps?.subContainer}>
          {children}
        </View>
      </View>
    </Component>
  );
};

export default RowContainer;
