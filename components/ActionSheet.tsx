import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { useAppSelector } from '../hooks/reduxHooks';

import { SIZE } from '../utils/Constants';

type IActionSheetProps = {
  visible: boolean;
  onClose: (arg0: boolean) => void;
  actionItems: string[];
  title?: string;
  numberOfLinesTitle: number;
  cancelButtonIndex?: number;
  modalStyle?: ViewStyle;
  itemStyle?: ViewStyle;
  itemTextStyle?: TextStyle;
  titleStyle?: TextStyle;
  itemIcons: React.ComponentProps<typeof MaterialIcons>['name'][];
  onItemPressed: (arg0: number) => void;
};

type IActionListItemProps = {
  item: string;
  index: number;
};

const ActionSheet = ({
  visible,
  onClose,
  actionItems,
  title,
  numberOfLinesTitle,
  cancelButtonIndex,
  modalStyle,
  itemStyle,
  itemTextStyle,
  titleStyle,
  itemIcons,
  onItemPressed,
}: IActionSheetProps) => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppSelector((state) => state.theme);

  const ActionListItem = ({ item, index }: IActionListItemProps) => {
    const isDestructive = index === cancelButtonIndex;
    return (
      <TouchableOpacity
        style={[styles.itemStyle, itemStyle]}
        activeOpacity={0.7}
        onPress={() => {
          onClose(false);
          if (Platform.OS === 'ios') {
            setTimeout(() => {
              onItemPressed(index);
            }, 300);
          } else {
            onItemPressed(index);
          }
        }}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={itemIcons[index]}
            size={24}
            color={isDestructive ? theme.colors.error : theme.colors.textSecondary}
          />
        </View>
        <Text
          style={[
            styles.itemText,
            { color: theme.colors.text },
            itemTextStyle,
            isDestructive && { color: theme.colors.error },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onClose(false);
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          onClose(false);
        }}
      >
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View
        style={[
          styles.modalBody,
          { backgroundColor: theme.colors.background3, paddingBottom: insets.bottom },
          modalStyle,
        ]}
      >
        {title && (
          <View style={[styles.titleContainer, { borderBottomColor: theme.colors.border }]}>
            <Text
              style={[styles.titleText, { color: theme.colors.textSecondary }, titleStyle]}
              ellipsizeMode="middle"
              numberOfLines={numberOfLinesTitle}
            >
              {title}
            </Text>
          </View>
        )}
        <FlatList
          data={actionItems}
          keyExtractor={(item) => item}
          renderItem={({ item, index }) => (
            <ActionListItem item={item} index={index} />
          )}
        />
      </View>
    </Modal>
  );
};

export default ActionSheet;

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBody: {
    width: SIZE,
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'white', // Will be overridden by inline style
    overflow: 'hidden',
  },
  titleContainer: {
    width: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  titleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    color: '#64748b',
  },
  itemStyle: {
    width: SIZE,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
  },
  itemText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
});
