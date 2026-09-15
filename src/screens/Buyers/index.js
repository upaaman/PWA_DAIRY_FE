import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BuyersScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buyers</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export default BuyersScreen;
