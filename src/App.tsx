import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>BLACKBOX</Text>
        <Text style={styles.title}>Recording is not enabled yet.</Text>
        <Text style={styles.body}>
          Phase 0 validates iPhone and Apple Watch recording behavior on real
          hardware before the native recorder is implemented.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101413',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  eyebrow: {
    color: '#69E39B',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#F5F7F6',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    color: '#AFB8B4',
    fontSize: 16,
    lineHeight: 24,
  },
});
