import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

import useLock from '../../hooks/useLock';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { setDarkTheme, setLightTheme } from '../../features/files/themeSlice';

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import useBiometrics from '../../hooks/useBiometrics';
import { setSnack } from '../../features/files/snackbarSlice';
import { SIZE } from '../../utils/Constants';

function Settings() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { theme } = useAppSelector((state) => state.theme);
  const { pinActive } = useLock();
  const { biometricsActive, hasHardware, isEnrolled, handleBiometricsStatus } =
    useBiometrics();
  const dispatch = useAppDispatch();

  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      style={[
        styles.sectionTitle,
        {
          color: theme.colors.primary,
          fontFamily: theme.typography.fontFamily.semiBold,
          marginLeft: theme.spacing.m,
          marginBottom: theme.spacing.s,
          marginTop: theme.spacing.l,
        },
      ]}
    >
      {title}
    </Text>
  );

  const SectionItem = ({
    icon,
    label,
    rightElement,
    onPress,
    isLast,
  }: {
    icon: React.ReactNode;
    label: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    isLast?: boolean;
  }) => {
    const Content = (
      <View
        style={[
          styles.sectionItem,
          {
            backgroundColor: theme.colors.background2,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.sectionItemLeft}>{icon}</View>
        <View style={styles.sectionItemCenter}>
          <Text
            style={[
              styles.sectionItemText,
              {
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {label}
          </Text>
        </View>
        <View style={styles.sectionItemRight}>
          {rightElement || (
            <Feather
              name="chevron-right"
              size={20}
              color={theme.colors.textSecondary}
            />
          )}
        </View>
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {Content}
        </TouchableOpacity>
      );
    }
    return Content;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.contentContainer}>
        <SectionHeader title="PREFERENCES" />
        <View
          style={[
            styles.sectionGroup,
            {
              backgroundColor: theme.colors.background2,
              borderRadius: theme.borderRadius.l,
              overflow: 'hidden',
            },
          ]}
        >
          <SectionItem
            icon={
              <Feather
                name={theme.dark ? 'moon' : 'sun'}
                size={20}
                color={theme.colors.primary}
              />
            }
            label="Dark Mode"
            isLast={true}
            rightElement={
              <Switch
                value={theme.dark}
                trackColor={{
                  false: theme.colors.switchFalse,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.switchThumb}
                onValueChange={async () => {
                  if (theme.dark) {
                    dispatch(setLightTheme());
                    await AsyncStorage.setItem('colorScheme', 'light');
                  } else {
                    dispatch(setDarkTheme());
                    await AsyncStorage.setItem('colorScheme', 'dark');
                  }
                }}
              />
            }
          />
        </View>

        <SectionHeader title="SECURITY" />
        <View
          style={[
            styles.sectionGroup,
            {
              backgroundColor: theme.colors.background2,
              borderRadius: theme.borderRadius.l,
              overflow: 'hidden',
            },
          ]}
        >
          <SectionItem
            icon={
              <Feather
                name={pinActive ? 'lock' : 'unlock'}
                size={20}
                color={theme.colors.primary}
              />
            }
            label="PIN Code"
            onPress={() => navigation.navigate('SetPassCodeScreen')}
          />
          <SectionItem
            icon={
              <FontAwesome5
                name="fingerprint"
                size={20}
                color={theme.colors.primary}
              />
            }
            label="Unlock with Biometrics"
            isLast={true}
            rightElement={
              <Switch
                value={biometricsActive}
                disabled={!hasHardware}
                trackColor={{
                  false: theme.colors.switchFalse,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.switchThumb}
                onValueChange={() => {
                  if (!hasHardware) {
                    dispatch(
                      setSnack({ message: 'Device has no biometrics hardware' })
                    );
                    return;
                  }
                  if (hasHardware && isEnrolled) {
                    handleBiometricsStatus();
                  } else if (hasHardware && !isEnrolled) {
                    dispatch(setSnack({ message: 'No biometrics enrolled!' }));
                  }
                }}
              />
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: Constants.statusBarHeight + 10,
  },
  sectionGroup: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionItem: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sectionItemText: {
    fontSize: 16,
  },
  sectionItemLeft: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sectionItemCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
