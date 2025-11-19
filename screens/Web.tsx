import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  BackHandler,
} from 'react-native';

import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import Constants from 'expo-constants';

import { useAppSelector } from '../hooks/reduxHooks';

const Web: React.FC = () => {
  const { colors } = useAppSelector((state) => state.theme.theme);
  const [target, setTarget] = useState('https://google.com/');
  const [url, setUrl] = useState(target);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingBarVisible, setLoadingBarVisible] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const browserRef = useRef<WebView>(null);

  useEffect(() => {
    const backAction = () => {
      browserRef.current.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const searchEngines = {
    google: (uri: string) => `https://www.google.com/search?q=${uri}`,
  };

  function upgradeURL(uri: string, searchEngine = 'google') {
    const isURL = uri.split(' ').length === 1 && uri.includes('.');
    if (isURL) {
      if (!uri.startsWith('http')) {
        return 'https://' + uri;
      }
      return uri;
    }
    const encodedURI = encodeURI(uri);
    return searchEngines[searchEngine](encodedURI);
  }

  const goForward = () => {
    if (browserRef && canGoForward) {
      browserRef.current.goForward();
    }
  };

  const goBack = () => {
    if (browserRef && canGoBack) {
      browserRef.current.goBack();
    }
  };

  const reloadPage = () => {
    if (browserRef) {
      browserRef.current.reload();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchBar}>
        <View style={styles.searchBarRow}>
          <TouchableOpacity onPress={goBack} style={styles.navButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={canGoBack ? colors.primary : colors.text}
              style={{ opacity: canGoBack ? 1 : 0.3 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={goForward} style={styles.navButton}>
            <Ionicons
              name="arrow-forward"
              size={24}
              color={canGoForward ? colors.primary : colors.text}
              style={{ opacity: canGoForward ? 1 : 0.3 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={reloadPage} style={styles.navButton}>
            <Ionicons name="refresh" size={24} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.searchBarInput,
              { borderColor: colors.primary, color: colors.text },
            ]}
            selection={!isFocused ? { start: 0, end: 0 } : null}
            blurOnSubmit
            keyboardType="url"
            onChangeText={(text) => setUrl(text)}
            onSubmitEditing={() => {
              Keyboard.dismiss;
              setTarget(upgradeURL(url));
            }}
            value={url}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <View
            style={{
              position: 'absolute',
              right: 10,
              borderRadius: 5,
              backgroundColor: colors.background,
            }}
          >
            <TouchableOpacity onPress={() => setTarget(url)}>
              <Ionicons
                name={'arrow-forward-circle-outline'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={[
            styles.progressBar,
            {
              width: `${loadingProgress * 100}%`,
              opacity: loadingBarVisible ? 1 : 0,
              backgroundColor: colors.primary,
            },
          ]}
        ></View>
      </View>
      <WebView
        allowsLinkPreview
        ref={browserRef}
        source={{ uri: target }}
        pullToRefreshEnabled
        pagingEnabled
        setSupportMultipleWindows={false}
        onLoadStart={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setLoadingBarVisible(nativeEvent.loading);
          setUrl(nativeEvent.url);
          setCanGoBack(nativeEvent.canGoBack);
          setCanGoForward(nativeEvent.canGoForward);
        }}
        onLoadEnd={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setLoadingBarVisible(nativeEvent.loading);
          setTarget(nativeEvent.url);
        }}
        onLoadProgress={({ nativeEvent }) => {
          setLoadingProgress(nativeEvent.progress);
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  searchBar: {
    flex: 0.1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '95%',
  },
  navButton: {
    marginRight: 10,
  },
  searchBarInput: {
    flex: 1,
    height: 40,
    borderWidth: 0.5,
    marginTop: 5,
    padding: 5,
    paddingRight: 45,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: 2,
    marginBottom: 2,
  },
});

export default Web;
