import React from 'react';
import { StyleSheet, Image, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SIZE } from '../../../utils/Constants';
import { ExtendedAsset } from '../../../types';

import { useAppSelector } from '../../../hooks/reduxHooks';

const ITEM_SIZE = SIZE / 3;

type AssetProps = {
  item: ExtendedAsset;
  isSelecting: boolean;
  toggleSelect: (asset: ExtendedAsset) => void;
};

export const AssetItem = ({
  item: asset,
  isSelecting,
  toggleSelect,
}: AssetProps) => {
  const { colors } = useAppSelector((state) => state.theme.theme);
  const handleToggleSelect = () => {
    toggleSelect(asset);
  };

  return (
    <TouchableOpacity
      key={asset.id}
      style={styles.assetContainer}
      activeOpacity={0.8}
      onLongPress={handleToggleSelect}
      onPress={handleToggleSelect}
    >
      <Image style={styles.assetImage} source={{ uri: asset.uri }} />
      {isSelecting && (
        <View style={styles.checkCircleContainer}>
          <View
            style={[
              styles.checkCircleBG,
              {
                backgroundColor: asset.selected ? colors.primary : 'rgba(255,255,255,0.5)',
                borderColor: colors.background,
              },
            ]}
          ></View>
          {asset.selected && (
            <Ionicons name="checkmark-done" size={20} color={colors.background} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  assetContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assetImage: {
    width: ITEM_SIZE * 0.95,
    height: ITEM_SIZE * 0.95,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  checkCircleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 24,
    height: 24,
  },
  checkCircleBG: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    opacity: 0.9,
  },
});
