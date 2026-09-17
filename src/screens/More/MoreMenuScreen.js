/**
 * MoreMenuScreen
 *
 * Simple menu listing secondary sections (Profile, Settings, ...).
 * Tapping an item navigates within the "More" stack.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../components/AppCard';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { MORE_ROUTES } from '../../navigation/routes';

const MENU_ITEMS = [
  { label: 'Profile', route: MORE_ROUTES.PROFILE },
  { label: 'Seller', route: MORE_ROUTES.SELLER },
  { label: 'Customer', route: MORE_ROUTES.CUSTOMER },
  { label: 'Settings', route: MORE_ROUTES.SETTINGS },
];

const MoreMenuScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {MENU_ITEMS.map(item => (
        <Pressable
          key={item.route}
          onPress={() => navigation.navigate(item.route)}
        >
          <AppCard style={styles.item}>
            <Text style={styles.itemText}>{item.label}</Text>
          </AppCard>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  item: {
    marginBottom: spacing.md,
  },
  itemText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
});

export default MoreMenuScreen;
