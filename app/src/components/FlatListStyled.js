import React from 'react';
import { StyleSheet, Animated } from 'react-native';

// repeat all the props so that VSCode can auto complete

const FlatListStyled = React.forwardRef(
  (
    {
      renderItem,
      data,
      ItemSeparatorComponent,
      ListEmptyComponent,
      ListFooterComponent,
      ListFooterComponentStyle,
      ListHeaderComponent,
      ListHeaderComponentStyle,
      columnWrapperStyle,
      extraData,
      getItemLayout,
      horizontal,
      initialNumToRender,
      initialScrollIndex,
      inverted,
      keyExtractor,
      numColumns,
      onEndReached,
      onEndReachedThreshold,
      onRefresh,
      onViewableItemsChanged,
      progressViewOffset,
      legacyImplementation,
      refreshing,
      removeClippedSubviews,
      viewabilityConfig,
      viewabilityConfigCallbackPairs,
      keyboardShouldPersistTaps,
      onScroll,
      onMomentumScrollEnd,
      onScrollEndDrag,
      parentScroll,
    },
    ref
  ) => (
    <Animated.FlatList
      ref={ref}
      contentContainerStyle={styles.contentContainerStyle}
      style={styles.content(parentScroll)}
      renderItem={renderItem}
      data={data}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListFooterComponentStyle={ListFooterComponentStyle}
      ListHeaderComponent={ListHeaderComponent}
      ListHeaderComponentStyle={ListHeaderComponentStyle}
      columnWrapperStyle={columnWrapperStyle}
      extraData={extraData}
      getItemLayout={getItemLayout}
      horizontal={horizontal}
      initialNumToRender={initialNumToRender}
      initialScrollIndex={initialScrollIndex}
      inverted={inverted}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onRefresh={onRefresh}
      onViewableItemsChanged={onViewableItemsChanged}
      progressViewOffset={progressViewOffset}
      legacyImplementation={legacyImplementation}
      refreshing={refreshing}
      removeClippedSubviews={removeClippedSubviews}
      viewabilityConfig={viewabilityConfig}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onScrollEndDrag={onScrollEndDrag}
    />
  )
);

export const SectionListStyled = React.forwardRef(
  (
    {
      renderItem,
      sections,
      extraData,
      initialNumToRender,
      inverted,
      ItemSeparatorComponent,
      keyExtractor,
      ListEmptyComponent,
      ListFooterComponent,
      ListHeaderComponent,
      onEndReached,
      onEndReachedThreshold,
      onRefresh,
      onViewableItemsChanged,
      refreshing,
      removeClippedSubviews,
      renderSectionFooter,
      renderSectionHeader,
      SectionSeparatorComponent,
      stickySectionHeadersEnabled,
      keyboardShouldPersistTaps,
      onScroll,
      onMomentumScrollEnd,
      onScrollEndDrag,
      parentScroll,
    },
    ref
  ) => (
    <Animated.SectionList
      scrollEventThrottle={16}
      ref={ref}
      contentContainerStyle={styles.contentContainerStyle}
      style={styles.content(parentScroll)}
      renderItem={renderItem}
      sections={sections}
      extraData={extraData}
      initialNumToRender={initialNumToRender}
      inverted={inverted}
      ItemSeparatorComponent={ItemSeparatorComponent}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onRefresh={onRefresh}
      onViewableItemsChanged={onViewableItemsChanged}
      refreshing={refreshing}
      removeClippedSubviews={removeClippedSubviews}
      renderSectionFooter={renderSectionFooter}
      renderSectionHeader={renderSectionHeader}
      SectionSeparatorComponent={SectionSeparatorComponent}
      stickySectionHeadersEnabled={stickySectionHeadersEnabled}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      onScroll={onScroll}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onScrollEndDrag={onScrollEndDrag}
    />
  )
);

const styles = StyleSheet.create({
  content: (parentScroll) => ({
    transform: [
      {
        translateY: parentScroll?.interpolate
          ? parentScroll.interpolate({
              inputRange: [0, 100],
              outputRange: [90, 0],
              extrapolate: 'clamp',
            })
          : 0,
      },
    ],
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#fff',
  }),
  contentContainerStyle: {
    flexGrow: 1,
    paddingTop: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#fff',
  },
});

export default FlatListStyled;
