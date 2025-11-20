import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';

import * as Sharing from 'expo-sharing';
import * as mime from 'react-native-mime-types';
import moment from 'moment';

import humanFileSize from '../../../utils/Filesize';
import ActionSheet from '../../ActionSheet';

import { fileItem } from '../../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector } from '../../../hooks/reduxHooks';
import { fileIcons } from '../../../utils/Constants';

type Props = {
  item: fileItem;
  currentDir: string;
  multiSelect: boolean;
  toggleSelect: (arg0: fileItem) => void;
  setTransferDialog: (arg0: boolean) => void;
  setMoveOrCopy: (arg0: string) => void;
  deleteSelectedFiles: (arg0?: fileItem) => void;
  setRenamingFile: (arg0: fileItem) => void;
  setRenameDialogVisible: (arg0: boolean) => void;
  setNewFileName: (arg0: string) => void;
};

export default function FileItem({
  item,
  currentDir,
  multiSelect,
  toggleSelect,
  setTransferDialog,
  setMoveOrCopy,
  deleteSelectedFiles,
  setRenamingFile,
  setRenameDialogVisible,
  setNewFileName,
}: Props) {
  const { colors } = useAppSelector((state) => state.theme.theme);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [itemActionsOpen, setItemActionsOpen] = useState(false);
  const docDir = currentDir;
  const itemMime = mime.lookup(item.uri) || ' ';
  const itemType: string = item.isDirectory ? 'dir' : itemMime.split('/')[0];
  const itemFormat: string = item.isDirectory ? 'dir' : itemMime.split('/')[1];

  const ThumbnailImage = ({ uri }) => {
    return (
      <Image
        style={styles.image}
        source={{
          uri,
        }}
      />
    );
  };

  const ItemThumbnail = () => {
    switch (itemType) {
      case 'dir':
        return <Feather name="folder" size={35} color={colors.primary} />;
      case 'image':
      case 'video':
        return <ThumbnailImage uri={item.uri} />;
      case 'audio':
        return (
          <FontAwesome5 name="file-audio" size={35} color={colors.primary} />
        );
      case 'font':
        return <FontAwesome5 name="font" size={35} color={colors.primary} />;
      case 'application':
        return (
          <MaterialCommunityIcons
            name={fileIcons[itemFormat] || 'file-outline'}
            size={35}
            color={colors.primary}
          />
        );
      case 'text':
        return (
          <MaterialCommunityIcons
            name={fileIcons[itemFormat] || 'file-outline'}
            size={35}
            color={colors.primary}
          />
        );
      default:
        return <Feather name="file" size={35} color={colors.primary} />;
    }
  };

  const onPressHandler = () => {
    if (!multiSelect) {
      if (item.isDirectory) {
        navigation.push('Browser', {
          folderName: item.name,
          prevDir: docDir,
        });
      } else if (itemType === 'image') {
        navigation.push('ImageGalleryView', {
          folderName: item.name,
          prevDir: docDir,
        });
      } else if (itemType === 'video') {
        navigation.push('VideoPlayer', {
          folderName: item.name,
          prevDir: docDir,
        });
      } else {
        navigation.push('MiscFileView', {
          folderName: item.name,
          prevDir: docDir,
        });
      }
    } else {
      toggleSelect(item);
    }
  };

  return (
    <View style={styles.container}>
      <ActionSheet
        title={
          multiSelect
            ? 'Choose an action for the selected items'
            : decodeURI(item.name)
        }
        numberOfLinesTitle={multiSelect ? undefined : 1}
        visible={itemActionsOpen}
        actionItems={['Rename', 'Move', 'Copy', 'Share', 'Delete', 'Cancel']}
        itemIcons={[
          'edit',
          'drive-file-move',
          'file-copy',
          'share',
          'delete',
          'close',
        ]}
        onClose={setItemActionsOpen}
        onItemPressed={(buttonIndex) => {
          if (buttonIndex === 4) {
            setTimeout(() => {
              Alert.alert(
                'Confirm Delete',
                `Are you sure you want to delete ${multiSelect ? 'selected files' : 'this file'
                }?`,
                [
                  {
                    text: 'Cancel',
                    onPress: () => { },
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    onPress: () => {
                      if (!multiSelect) deleteSelectedFiles(item);
                      else deleteSelectedFiles();
                    },
                  },
                ]
              );
            }, 300);
          } else if (buttonIndex === 3) {
            Sharing.isAvailableAsync().then((canShare) => {
              if (canShare) {
                Sharing.shareAsync(docDir + '/' + item.name);
              }
            });
          } else if (buttonIndex === 2) {
            setMoveOrCopy('Copy');
            if (!multiSelect) toggleSelect(item);
            setTransferDialog(true);
          } else if (buttonIndex === 1) {
            setMoveOrCopy('Move');
            if (!multiSelect) toggleSelect(item);
            setTransferDialog(true);
          } else if (buttonIndex === 0) {
            setRenamingFile(item);
            setRenameDialogVisible(true);
            setNewFileName(item.name);
          }
        }}
        cancelButtonIndex={5}
        modalStyle={{ backgroundColor: colors.background2 }}
        itemTextStyle={{ color: colors.text }}
        titleStyle={{ color: colors.textSecondary }}
      />
      <View style={[styles.itemContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.itemContent}
          activeOpacity={0.7}
          onPress={onPressHandler}
          onLongPress={() => {
            if (!multiSelect) {
              toggleSelect(item);
            }
          }}
        >
          <View style={styles.itemThumbnail}>
            {itemType && <ItemThumbnail />}
          </View>
          <View style={styles.itemDetails}>
            <Text
              numberOfLines={1}
              style={[styles.fileName, { color: colors.text }]}
            >
              {decodeURI(item.name)}
            </Text>
            <View style={styles.fileMeta}>
              <Text style={[styles.fileDetailText, { color: colors.textSecondary }]}>
                {humanFileSize(item.size)}
              </Text>
              <Text style={[styles.fileDetailText, { color: colors.textSecondary, marginLeft: 8 }]}>
                {moment(item.modificationTime * 1000).fromNow()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemActionButton}
          onPress={() => setItemActionsOpen(true)}
        >
          {!item.selected ? (
            <Feather
              name="more-vertical"
              size={20}
              color={colors.textSecondary}
            />
          ) : (
            <Feather name="check-square" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumbnail: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  itemActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});
