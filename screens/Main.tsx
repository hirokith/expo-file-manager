import React, { useEffect } from 'react';
import { LogBox, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { Snackbar } from 'react-native-paper';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

import { MainNavigator } from '../navigation/MainNavigator';

import useColorScheme from '../hooks/useColorScheme';
import useLock from '../hooks/useLock';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { setLightTheme, setDarkTheme } from '../features/files/themeSlice';
import { hideSnack } from '../features/files/snackbarSlice';
import { DarkTheme, LightTheme } from '../theme';

import LockScreen from '../screens/LockScreen';
import { useIncomingShare } from '../hooks/useIncomingShare';

export const navigationRef = createNavigationContainerRef();

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'VirtualizedLists should never',
  'supplied to `DialogInput`',
]);

export default function Main() {
  const { locked, setLocked } = useLock();
  const { theme } = useAppSelector((state) => state.theme);
  const {
    isVisible: isSnackVisible,
    message: snackMessage,
    label: snackLabel,
  } = useAppSelector((state) => state.snackbar);
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const { hasShareIntent, shareIntent, resetShareIntent } = useIncomingShare();

  useEffect(() => {
    if (hasShareIntent && shareIntent.files && navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('Browser', {
        saveMode: true,
        sharedFiles: shareIntent.files,
      });
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  const getPassCodeStatus = async () => {
    const hasPassCode = await SecureStore.getItemAsync('hasPassCode');
    if (JSON.parse(hasPassCode)) {
      setLocked(true);
      return true;
    } else {
      setLocked(false);
      return false;
    }
  };

  useEffect(() => {
    getPassCodeStatus();
  }, []);

  useEffect(() => {
    const setColorScheme = async () => {
      const storedScheme = await AsyncStorage.getItem('colorScheme');
      if (!storedScheme) {
        await AsyncStorage.setItem('colorScheme', colorScheme);
        dispatch(colorScheme === 'dark' ? setDarkTheme() : setLightTheme());
      } else {
        dispatch(storedScheme === 'dark' ? setDarkTheme() : setLightTheme());
      }
    };
    setColorScheme();
  }, []);

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (locked && fontsLoaded) {
    return <LockScreen setLocked={setLocked} />;
  }

  if (!fontsLoaded) {
    return null;
  }

  // Ensure we are using the updated theme object from theme.ts, 
  // but since it's in Redux, we might need to make sure the Redux state is synced or just use the one from props if passed.
  // However, the Redux state likely stores a plain object or a reference. 
  // For now, we assume the Redux state structure matches what we expect, 
  // but we should probably update the initial state in themeSlice if it hardcodes the old theme.
  // Let's check themeSlice later. For now, we pass the correct theme to NavigationContainer.

  const currentTheme = theme.dark ? DarkTheme : LightTheme;

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.colors.background }}>
      <Snackbar
        visible={isSnackVisible}
        style={{ backgroundColor: currentTheme.colors.background3 }}
        theme={{
          colors: { surface: currentTheme.colors.text },
        }}
        onDismiss={() => dispatch(hideSnack())}
        duration={2000}
        action={
          snackLabel
            ? {
              label: snackLabel,
              onPress: () => { },
            }
            : null
        }
      >
        {snackMessage}
      </Snackbar>
      <StatusBar style={currentTheme.dark ? 'light' : 'dark'} />
      <NavigationContainer theme={currentTheme} ref={navigationRef}>
        <MainNavigator />
      </NavigationContainer>
    </View>
  );
}
