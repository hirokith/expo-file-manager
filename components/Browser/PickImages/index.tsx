import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Alert,
  Linking,
  AlertButton,
  ActivityIndicator,
  TouchableOpacity,
  Button,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { SafeAreaView } from 'react-native-safe-area-context';
import useMultiImageSelection from '../../../hooks/useMultiImageSelection';
import { customAlbum, ExtendedAsset } from '../../../types';
import { AlbumList } from './AlbumList';
import { AssetList } from './AssetList';
import { useAppSelector } from '../../../hooks/reduxHooks';

type PickImagesProps = {
  onMultiSelectSubmit: (data: ExtendedAsset[]) => void;
  onClose: () => void;
  selectionMode?: 'single' | 'multi';
};

const ALL_PHOTOS_ID = '__all__';

export type selectedAlbumType = {
  id: string | null;
  title: string;
};

export default function PickImages({
  onMultiSelectSubmit,
  onClose,
  selectionMode = 'multi',
}: PickImagesProps) {
  const { colors } = useAppSelector((state) => state.theme.theme);
  const [isMediaGranted, setIsMediaGranted] = useState<boolean | null>(null);
  const [albums, setAlbums] = useState<customAlbum[]>([]);
  const [albumsFetched, setAlbumsFetched] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<selectedAlbumType | null>(
    null
  );
  const [assets, setAssets] = useState<ExtendedAsset[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(null);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<ExtendedAsset[]>([]);
  const isSingleSelection = selectionMode === 'single';
  const isSelecting = useMultiImageSelection(assets);
  const showSelectionActions = !isSingleSelection && isSelecting;

  const resetAssetState = useCallback(() => {
    setAssets([]);
    setSelectedAssets([]);
    setHasNextPage(null);
    setEndCursor(null);
  }, []);

  const resolveAssetUri = useCallback(async (asset: ExtendedAsset) => {
    if (asset.uri?.startsWith('ph://')) {
      try {
        const info = await MediaLibrary.getAssetInfoAsync(asset, {
          shouldDownloadFromNetwork: false,
        });
        if (info.localUri) {
          return { ...asset, uri: info.localUri };
        }
      } catch (error) {
        console.warn('Failed to resolve asset URI', asset.id, error);
      }
    }
    return asset;
  }, []);

  async function getAlbums() {
    const [userAlbums, allAssetsPreview] = await Promise.all([
      MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true }),
      MediaLibrary.getAssetsAsync({
        first: 1,
        sortBy: MediaLibrary.SortBy.creationTime,
      }),
    ]);

    const albumAssetPages = await Promise.all(
      userAlbums.map((album) =>
        MediaLibrary.getAssetsAsync({
          album,
          first: 10,
          sortBy: MediaLibrary.SortBy.default,
        })
      )
    );

    const nonEmptyAlbums = await Promise.all(
      albumAssetPages
        .filter((item) => item.totalCount > 0 && item.assets.length > 0)
        .map(async (item) => {
          const album = userAlbums.find((a) => a.id === item.assets[0].albumId);
          const coverAsset = await resolveAssetUri(item.assets[0]);
          const albumObject: customAlbum = {
            id: album?.id,
            title: album?.title,
            assetCount: album?.assetCount,
            type: album?.type,
            coverImage: coverAsset.uri,
          };
          return albumObject;
        })
    );

    const allPhotosCoverAsset = allAssetsPreview.assets[0]
      ? await resolveAssetUri(allAssetsPreview.assets[0])
      : undefined;

    const allPhotosAlbum: customAlbum = {
      id: ALL_PHOTOS_ID,
      title: 'All Photos',
      assetCount: allAssetsPreview.totalCount,
      type: 'smart',
      coverImage: allPhotosCoverAsset?.uri,
    };

    setAlbums([allPhotosAlbum, ...nonEmptyAlbums]);
    setAlbumsFetched(true);

    if (isSingleSelection && !selectedAlbum) {
      setSelectedAlbum({ id: ALL_PHOTOS_ID, title: 'All Photos' });
    }
  }

  async function getAlbumAssets(albumId?: string | null, after?: string) {
    const options: MediaLibrary.AssetsOptions = {
      first: 50,
      sortBy: MediaLibrary.SortBy.creationTime,
    };
    if (albumId && albumId !== ALL_PHOTOS_ID) {
      options.album = albumId;
    }
    if (after) options.after = after;
    const albumAssets = await MediaLibrary.getAssetsAsync(options);
    const resolvedAssets = await Promise.all(
      albumAssets.assets.map((asset) => resolveAssetUri(asset))
    );
    setAssets((prev) => [...prev, ...resolvedAssets]);
    setHasNextPage(albumAssets.hasNextPage);
    setEndCursor(albumAssets.endCursor);
  }

  const toggleSelect = (item: ExtendedAsset) => {
    if (isSingleSelection) {
      onClose();
      onMultiSelectSubmit([item]);
      return;
    }
    const isSelected =
      selectedAssets.findIndex((asset) => asset.id === item.id) !== -1;
    if (!isSelected) setSelectedAssets((prev) => [...prev, item]);
    else
      setSelectedAssets((prev) => [
        ...prev.filter((asset) => asset.id !== item.id),
      ]);
    setAssets((prevAssets) =>
      prevAssets.map((asset) =>
        asset.id === item.id
          ? { ...asset, selected: !asset.selected }
          : asset
      )
    );
  };

  const handleImport = () => {
    if (selectedAssets.length === 0) return;
    onClose();
    onMultiSelectSubmit(selectedAssets);
    return selectedAssets;
  };

  // const unSelectAll = () => {
  //   setAssets(
  //     assets.map((i) => {
  //       i.selected = false;
  //       return i;
  //     })
  //   );
  // };

  useEffect(() => {
    const requestMediaPermission = async () => {
      MediaLibrary.requestPermissionsAsync()
        .then((result) => {
          setIsMediaGranted(result.granted);
          if (!result.granted || result.accessPrivileges === 'limited') {
            const alertOptions: AlertButton[] = [
              {
                text: 'Go to App Settings',
                onPress: () => {
                  Linking.openSettings();
                },
              },
              {
                text: 'Nevermind',
                onPress: () => { },
                style: 'cancel',
              },
            ];
            if (result.canAskAgain && result.accessPrivileges !== 'limited')
              alertOptions.push({
                text: 'Request again',
                onPress: () => requestMediaPermission(),
              });
            Alert.alert(
              'Denied Media Access',
              'App needs access to all media library',
              [...alertOptions]
            );
          }
          if (result.granted) getAlbums();
        })
        .catch((err) => {
          console.log(err);
        });
    };
    requestMediaPermission();
  }, []);

  useEffect(() => {
    if (selectedAlbum) {
      resetAssetState();
      getAlbumAssets(selectedAlbum.id);
    }
  }, [selectedAlbum, resetAssetState]);

  const handleAlbumSelection = (album: selectedAlbumType | null) => {
    if (!album) {
      resetAssetState();
      setSelectedAlbum(null);
      return;
    }
    if (album.id === selectedAlbum?.id) return;
    setSelectedAlbum(album);
  };

  if (!isMediaGranted && isMediaGranted !== null)
    return (
      <SafeAreaView
        style={{
          ...styles.noAccessContainer,
          backgroundColor: colors.background,
        }}
        edges={['top', 'bottom']}
      >
        <Text style={{ ...styles.noAccessText, color: colors.primary }}>
          {'Media Access Denied'}
        </Text>
        <Button title="Go to Settings" onPress={() => Linking.openSettings()} />
      </SafeAreaView>
    );

  if (!albumsFetched)
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ ...styles.container, backgroundColor: colors.background2 }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );

  if (albumsFetched && albums.length === 0)
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ ...styles.container, backgroundColor: colors.background2 }}
      >
        <Text style={{ color: colors.text, fontFamily: 'Poppins_600SemiBold' }}>
          No Albums Found
        </Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ ...styles.container, backgroundColor: colors.background }}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {selectedAlbum ? (
            <TouchableOpacity onPress={() => handleAlbumSelection(null)}>
              <Feather name="chevron-left" size={28} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerTitle}>
          <Text style={{ ...styles.title, color: colors.text }}>
            {selectedAlbum?.title || 'Albums'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {showSelectionActions && (
            <TouchableOpacity
              style={styles.handleImport}
              onPress={handleImport}
            >
              <Text style={{ ...styles.importText, color: colors.primary }}>
                Import ({selectedAssets.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        {albumsFetched && !selectedAlbum && (
          <AlbumList albums={albums} setSelectedAlbum={handleAlbumSelection} />
        )}
        {selectedAlbum && (
          <AssetList
            assets={assets}
            albumId={selectedAlbum.id}
            getAlbumAssets={getAlbumAssets}
            hasNextPage={hasNextPage}
            endCursor={endCursor}
            toggleSelect={toggleSelect}
            isSelecting={showSelectionActions}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    minWidth: 60,
    alignItems: 'flex-start',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  listContainer: {
    width: '100%',
    flex: 1,
  },
  noAccessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    textAlign: 'center',
  },
  noAccessText: {
    marginBottom: 20,
    fontFamily: 'Inter_500Medium',
  },
  handleImport: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginLeft: 4,
  },
});
