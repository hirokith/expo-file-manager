import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SIZE } from '../../../utils/Constants';
import { AssetItem } from './AssetItem';
import { ExtendedAsset } from '../../../types';

type AssetListProps = {
  assets: ExtendedAsset[];
  albumId: string | null;
  hasNextPage: boolean | null;
  endCursor: string | null;
  isSelecting: boolean;
  getAlbumAssets: (albumId?: string | null, after?: string | undefined) => void;
  toggleSelect: (asset: ExtendedAsset) => void;
};

export const AssetList = ({
  assets,
  albumId,
  hasNextPage,
  endCursor,
  isSelecting,
  getAlbumAssets,
  toggleSelect,
}: AssetListProps) => {
  return (
    <FlatList
      style={styles.albumList}
      contentContainerStyle={styles.contentContainer}
      numColumns={3}
      nestedScrollEnabled
      data={assets}
      renderItem={({ item }) => (
        <AssetItem
          item={item}
          toggleSelect={toggleSelect}
          isSelecting={isSelecting}
        />
      )}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (hasNextPage) getAlbumAssets(albumId, endCursor || undefined);
      }}
      onEndReachedThreshold={0.9}
    />
  );
};

const styles = StyleSheet.create({
  albumList: {
    width: SIZE,
  },
  contentContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
});
