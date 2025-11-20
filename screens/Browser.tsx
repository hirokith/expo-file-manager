import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  BackHandler,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

import Dialog from 'react-native-dialog';

import { ProgressDialog } from 'react-native-simple-dialogs';
import { AntDesign, Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import FileItem from '../components/Browser/Files/FileItem';
import Pickimages from '../components/Browser/PickImages';
import ActionSheet from '../components/ActionSheet';

import useSelectionChange from '../hooks/useSelectionChange';
import allProgress from '../utils/promiseProgress';

import { NewFolderDialog } from '../components/Browser/NewFolderDialog';
import { DownloadDialog } from '../components/Browser/DownloadDialog';
import { FileTransferDialog } from '../components/Browser/FileTransferDialog';

import axios, { AxiosError } from 'axios';
import moment from 'moment';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as mime from 'react-native-mime-types';

import { StackScreenProps, StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { ExtendedAsset, fileItem } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { setImages } from '../features/files/imagesSlice';
import { setSnack, snackActionPayload } from '../features/files/snackbarSlice';
import { HEIGHT, imageFormats, SIZE } from '../utils/Constants';

type BrowserParamList = {
  Browser: { prevDir: string; folderName: string; saveMode?: boolean; sharedFiles?: any[] };
};

type IBrowserProps = StackScreenProps<BrowserParamList, 'Browser'>;

const Browser = ({ route }: IBrowserProps) => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<StackNavigationProp<BrowserParamList, 'Browser'>>();
  const { colors } = useAppSelector((state) => state.theme.theme);
  const docDir: string = FileSystem.documentDirectory || '';
  const [currentDir, setCurrentDir] = useState<string>(
    route?.params?.prevDir !== undefined ? route?.params?.prevDir : docDir
  );
  const [saveMode, setSaveMode] = useState(route?.params?.saveMode || false);
  const [sharedFilesToSave, setSharedFilesToSave] = useState<any[]>(
    route?.params?.sharedFiles || []
  );
  const [moveDir, setMoveDir] = useState('');
  const [files, setFiles] = useState<fileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<fileItem[]>([]);
  const [folderDialogVisible, setFolderDialogVisible] = useState(false);
  const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState<fileItem>();
  const renameInputRef = useRef<TextInput>(null);
  const [multiImageVisible, setMultiImageVisible] = useState(false);
  const [importProgressVisible, setImportProgressVisible] = useState(false);
  const [destinationDialogVisible, setDestinationDialogVisible] =
    useState(false);
  const [newFileActionSheet, setNewFileActionSheet] = useState(false);
  const [moveOrCopy, setMoveOrCopy] = useState('');
  const { multiSelect, allSelected } = useSelectionChange(files);
  const [imagePickerMode, setImagePickerMode] = useState<'single' | 'multi'>(
    'multi'
  );

  useEffect(() => {
    getFiles();
  }, [currentDir]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getFiles();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.folderName !== undefined) {
      setCurrentDir((prev) =>
        prev?.endsWith('/')
          ? prev + route.params.folderName
          : prev + '/' + route.params.folderName
      );
    }
    if (route?.params?.saveMode !== undefined) {
      setSaveMode(route.params.saveMode);
    }
    if (route?.params?.sharedFiles !== undefined) {
      setSharedFilesToSave(route.params.sharedFiles);
    }
  }, [route]);

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const renderItem = ({ item }: { item: fileItem }) => (
    <FileItem
      item={item}
      currentDir={currentDir}
      toggleSelect={toggleSelect}
      multiSelect={multiSelect}
      setTransferDialog={setDestinationDialogVisible}
      setMoveOrCopy={setMoveOrCopy}
      deleteSelectedFiles={deleteSelectedFiles}
      setRenamingFile={setRenamingFile}
      setRenameDialogVisible={setRenameDialogVisible}
      setNewFileName={setNewFileName}
    ></FileItem>
  );

  const handleDownload = (downloadUrl: string) => {
    axios
      .get(downloadUrl)
      .then((res) => {
        const fileExt = mime.extension(res.headers['content-type']);
        FileSystem.downloadAsync(
          downloadUrl,
          currentDir + '/DL_' + moment().format('DDMMYHmmss') + '.' + fileExt
        )
          .then(() => {
            getFiles();
            setDownloadDialogVisible(false);
            handleSetSnack({
              message: 'Download complete',
            });
          })
          .catch((_) => {
            handleSetSnack({
              message: 'Please provide a correct url',
            });
          });
      })
      .catch((error: AxiosError) =>
        handleSetSnack({
          message: error.message,
        })
      );
  };

  const toggleSelect = (item: fileItem) => {
    if (item.selected && selectedFiles.includes(item)) {
      const index = selectedFiles.indexOf(item);
      if (index > -1) {
        selectedFiles.splice(index, 1);
      }
    } else if (!item.selected && !selectedFiles.includes(item)) {
      setSelectedFiles((prev) => [...prev, item]);
    }
    setFiles(
      files.map((i) => {
        if (item === i) {
          i.selected = !i.selected;
        }
        return i;
      })
    );
  };

  const toggleSelectAll = () => {
    if (!allSelected) {
      setFiles(
        files.map((item) => {
          item.selected = true;
          return item;
        })
      );
      setSelectedFiles(files);
    } else {
      setFiles(
        files.map((item) => {
          item.selected = false;
          return item;
        })
      );
      setSelectedFiles([]);
    }
  };

  const getFiles = async () => {
    FileSystem.readDirectoryAsync(currentDir)
      .then((dirFiles) => {
        if (currentDir !== route?.params?.prevDir) {
          const filteredFiles = dirFiles.filter(
            (file) => file !== 'RCTAsyncLocalStorage'
          );
          const filesProms = filteredFiles.map((fileName) =>
            FileSystem.getInfoAsync(currentDir + '/' + fileName)
          );
          Promise.all(filesProms).then((results) => {
            let tempfiles: fileItem[] = results.map((file) => {
              const name = file.uri.endsWith('/')
                ? file.uri
                  .slice(0, file.uri.length - 1)
                  .split('/')
                  .pop()
                : file.uri.split('/').pop();
              return Object({
                ...file,
                name,
                selected: false,
              });
            });
            setFiles(tempfiles);
            const tempImageFiles = results.filter((file) => {
              let fileExtension = file.uri
                .split('/')
                .pop()
                .split('.')
                .pop()
                .toLowerCase();
              if (imageFormats.includes(fileExtension)) {
                return file;
              }
            });
            dispatch(setImages(tempImageFiles));
          });
        }
      })
      .catch((_) => { });
  };

  async function createDirectory(name: string) {
    FileSystem.makeDirectoryAsync(currentDir + '/' + name)
      .then(() => {
        getFiles();
        setFolderDialogVisible(false);
      })
      .catch(() => {
        handleSetSnack({
          message: 'Folder could not be created or already exists.',
        });
      });
  }

  async function handleCopy(
    from: string,
    to: string,
    successMessage: string,
    errorMessage: string
  ): Promise<void> {
    FileSystem.copyAsync({ from, to })
      .then(() => {
        getFiles();
        handleSetSnack({
          message: successMessage,
        });
      })
      .catch(() =>
        handleSetSnack({
          message: errorMessage,
        })
      );
  }

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const { name, uri } = result.assets[0];
      const { exists: fileExists } = await FileSystem.getInfoAsync(
        currentDir + '/' + name
      );
      if (fileExists) {
        Alert.alert(
          'Conflicting File',
          `The destination folder has a file with the same name ${name}`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Replace the file',
              onPress: () => {
                handleCopy(
                  uri,
                  currentDir + '/' + name,
                  `${name} successfully copied.`,
                  'An unexpected error importing the file.'
                );
              },
              style: 'default',
            },
          ]
        );
      } else {
        handleCopy(
          uri,
          currentDir + '/' + name,
          `${name} successfully copied.`,
          'An unexpected error importing the file.'
        );
      }
    }
  };

  const onMultiSelectSubmit = async (data: ExtendedAsset[]) => {
    const transferPromises = data.map((file) =>
      FileSystem.copyAsync({
        from: file.uri,
        to: currentDir + '/' + file.filename,
      })
    );
    Promise.all(transferPromises).then(() => {
      setMultiImageVisible(false);
      getFiles();
    });
  };

  const moveSelectedFiles = async (destination: string) => {
    const selectedFiles = files.filter((file) => file.selected);
    const destinationFolderFiles = await FileSystem.readDirectoryAsync(
      destination
    );
    function executeTransfer() {
      const transferPromises = selectedFiles.map((file) => {
        if (moveOrCopy === 'Copy')
          return FileSystem.copyAsync({
            from: currentDir + '/' + file.name,
            to: destination + '/' + file.name,
          });
        else
          return FileSystem.moveAsync({
            from: currentDir + '/' + file.name,
            to: destination + '/' + file.name,
          });
      });
      allProgress(transferPromises, (p) => { }).then((_) => {
        setDestinationDialogVisible(false);
        setMoveDir('');
        setMoveOrCopy('');
        getFiles();
      });
    }
    const conflictingFiles = selectedFiles.filter((file) =>
      destinationFolderFiles.includes(file.name)
    );
    const confLen = conflictingFiles.length;
    if (confLen > 0) {
      Alert.alert(
        'Conflicting Files',
        `The destination folder has ${confLen} ${confLen === 1 ? 'file' : 'files'
        } with the same ${confLen === 1 ? 'name' : 'names'}.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Replace the files',
            onPress: () => {
              executeTransfer();
            },
            style: 'default',
          },
        ]
      );
    } else {
      executeTransfer();
    }
  };

  const deleteSelectedFiles = async (file?: fileItem) => {
    const filestoBeDeleted = file ? [file] : selectedFiles;
    const deleteProms = filestoBeDeleted.map((file) =>
      FileSystem.deleteAsync(file.uri)
    );
    Promise.all(deleteProms)
      .then((_) => {
        handleSetSnack({
          message: 'Files deleted!',
        });
        getFiles();
        setSelectedFiles([]);
      })
      .catch((err) => {
        console.log(err);
        getFiles();
      });
  };

  const [initialSelectionDone, setInitialSelectionDone] = useState(false);

  useEffect(() => {
    if (renameDialogVisible && Platform.OS === 'android') {
      setTimeout(() => {
        renameInputRef.current?.focus();
      }, 100);
    }
    if (!renameDialogVisible)
      setTimeout(() => {
        setInitialSelectionDone(false);
      }, 500);
  }, [renameDialogVisible]);

  const onRename = async () => {
    const filePathSplit = renamingFile.uri.split('/');
    const fileFolderPath = filePathSplit
      .slice(0, filePathSplit.length - 1)
      .join('/');
    FileSystem.getInfoAsync(fileFolderPath + '/' + newFileName).then((res) => {
      if (res.exists)
        handleSetSnack({
          message: 'A folder or file with the same name already exists.',
        });
      else
        FileSystem.moveAsync({
          from: renamingFile.uri,
          to: fileFolderPath + '/' + newFileName,
        })
          .then(() => {
            setRenameDialogVisible(false);
            getFiles();
          })
          .catch((_) =>
            handleSetSnack({
              message: 'Error renaming the file/folder',
            })
          );
    });
  };

  const handleSetSnack = (data: snackActionPayload) => {
    dispatch(setSnack(data));
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <ActionSheet
        title={'Add a new file'}
        numberOfLinesTitle={1}
        visible={newFileActionSheet}
        actionItems={[
          'Camera Roll',
          'Multi Image Picker',
          'Import File from Storage',
          'Download',
          'Cancel',
        ]}
        itemIcons={[
          'camera-alt',
          'image',
          'drive-file-move',
          'file-download',
          'close',
        ]}
        onClose={setNewFileActionSheet}
        onItemPressed={(buttonIndex) => {
          if (buttonIndex === 0) {
            setImagePickerMode('single');
            setMultiImageVisible(true);
          } else if (buttonIndex === 1) {
            setImagePickerMode('multi');
            setMultiImageVisible(true);
          } else if (buttonIndex === 2) {
            pickDocument();
          } else if (buttonIndex === 3) {
            setDownloadDialogVisible(true);
          }
        }}
        cancelButtonIndex={4}
        modalStyle={{ backgroundColor: colors.background2 }}
        itemTextStyle={{ color: colors.text }}
        titleStyle={{ color: colors.textSecondary }}
      />
      <FileTransferDialog
        isVisible={destinationDialogVisible}
        setIsVisible={setDestinationDialogVisible}
        currentDir={docDir}
        moveDir={moveDir}
        setMoveDir={setMoveDir}
        moveSelectedFiles={moveSelectedFiles}
        moveOrCopy={moveOrCopy}
        setMoveOrCopy={setMoveOrCopy}
      />
      <NewFolderDialog
        visible={folderDialogVisible}
        createDirectory={createDirectory}
        setFolderDialogVisible={setFolderDialogVisible}
      />
      <DownloadDialog
        visible={downloadDialogVisible}
        handleDownload={handleDownload}
        setDownloadDialog={setDownloadDialogVisible}
      />
      <Dialog.Container visible={renameDialogVisible}>
        <Dialog.Title style={{ color: colors.text }}>Rename file</Dialog.Title>
        <Dialog.Input
          textInputRef={renameInputRef}
          value={decodeURI(newFileName)}
          onChangeText={(text) => {
            setNewFileName(text);
          }}
          onKeyPress={() => {
            setInitialSelectionDone(true);
          }}
          selection={
            !initialSelectionDone
              ? { start: 0, end: decodeURI(newFileName).split('.')[0].length }
              : undefined
          }
          style={{ color: colors.text }}
        ></Dialog.Input>
        <Dialog.Button
          label="Cancel"
          onPress={() => {
            setRenameDialogVisible(false);
          }}
        />
        <Dialog.Button label="Rename" onPress={() => onRename()} />
      </Dialog.Container>
      <Modal
        visible={multiImageVisible}
        animationType="slide"
        transparent
        hardwareAccelerated
        presentationStyle="overFullScreen"
        onRequestClose={() => setMultiImageVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableWithoutFeedback onPress={() => setMultiImageVisible(false)}>
            <View style={styles.pickerModalBackdrop} />
          </TouchableWithoutFeedback>
          <View
            style={[
              styles.pickerModalContent,
              { backgroundColor: colors.background2 },
            ]}
          >
            <Pickimages
              selectionMode={imagePickerMode}
              onMultiSelectSubmit={onMultiSelectSubmit}
              onClose={() => setMultiImageVisible(false)}
            />
          </View>
        </View>
      </Modal>

      <ProgressDialog
        visible={importProgressVisible}
        title="Importing Assets"
        message="Please, wait..."
      />

      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {currentDir === docDir ? 'Files' : currentDir.split('/').pop()}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background2 }]}
            onPress={() => setNewFileActionSheet(true)}
          >
            <AntDesign name="plus" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background2, marginLeft: 8 }]}
            onPress={() => setFolderDialogVisible(true)}
          >
            <Feather name="folder-plus" size={24} color={colors.primary} />
          </TouchableOpacity>
          {multiSelect && (
            <>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.background2, marginLeft: 8 }]}
                onPress={() => {
                  setDestinationDialogVisible(true);
                  setMoveOrCopy('Move');
                }}
              >
                <MaterialCommunityIcons
                  name="file-move-outline"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.background2, marginLeft: 8 }]}
                onPress={toggleSelectAll}
              >
                <Feather
                  name={allSelected ? 'check-square' : 'square'}
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>


      {
        saveMode && (
          <View style={{ padding: 16, backgroundColor: colors.background2, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              Saving {sharedFilesToSave.length} file(s) to:
            </Text>
            <Text style={{ color: colors.primary, fontWeight: 'bold', marginBottom: 16 }}>
              {currentDir.split('/').pop() || 'Documents'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ padding: 10, backgroundColor: colors.error, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' }}
                onPress={() => {
                  setSaveMode(false);
                  setSharedFilesToSave([]);
                  navigation.setParams({ saveMode: false, sharedFiles: [] });
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 10, backgroundColor: colors.primary, borderRadius: 8, flex: 1, marginLeft: 8, alignItems: 'center' }}
                onPress={async () => {
                  const promises = sharedFilesToSave.map(async (file) => {
                    const fileName = file.fileName || file.path.split('/').pop();
                    const destination = currentDir + '/' + fileName;
                    try {
                      await FileSystem.copyAsync({
                        from: file.path,
                        to: destination,
                      });
                    } catch (e) {
                      console.error('Error saving file:', e);
                      handleSetSnack({ message: `Error saving ${fileName}` });
                    }
                  });

                  setImportProgressVisible(true);
                  await Promise.all(promises);
                  setImportProgressVisible(false);
                  handleSetSnack({ message: 'Files saved successfully' });
                  setSaveMode(false);
                  setSharedFilesToSave([]);
                  navigation.setParams({ saveMode: false, sharedFiles: [] });
                  getFiles();
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      }

      <View style={styles.fileList}>
        <FlatList
          data={files}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          keyExtractor={_keyExtractor}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </View >
  );
};

const _keyExtractor = (item: fileItem) => item.name;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SIZE,
    paddingTop: Constants.statusBarHeight,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pickerModalContent: {
    width: SIZE,
    height: HEIGHT * 0.8,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 1,
  },
});

export default Browser;
