/**
 * MoreMenuScreen
 *
 * Hub for the More tab: a branded hero card on top, then grouped menu
 * rows (Farming / General) with icons and navigation targets.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../components/AppCard';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import {
  CUSTOMER_ROUTES,
  EMPLOYEE_ROUTES,
  EXPENSE_ROUTES,
  MORE_ROUTES,
  SELLER_ROUTES,
} from '../../navigation/routes';

const MENU_SECTIONS = [
  {
    header: 'Farming',
    items: [
      { label: 'Sellers', subtitle: 'Milk sellers & accounts', icon: '🚚', route: SELLER_ROUTES.LIST },
      { label: 'Customers', subtitle: 'Milk customers & accounts', icon: '👥', route: CUSTOMER_ROUTES.LIST },
      { label: 'Employee', subtitle: 'Salaries & pay records', icon: '🧑‍🌾', route: EMPLOYEE_ROUTES.SCREEN },
      { label: 'Expense', subtitle: 'Feed, medicine & misc', icon: '🧾', route: EXPENSE_ROUTES.LIST },
    ],
  },
  {
    header: 'General',
    items: [
      { label: 'Profile', subtitle: 'Your farm details', icon: '👤', route: MORE_ROUTES.PROFILE },
      { label: 'Settings', subtitle: 'App preferences', icon: '⚙️', route: MORE_ROUTES.SETTINGS },
    ],
  },
];

const MoreMenuScreen = ({ navigation }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppCard variant="raised" style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <Text style={styles.heroTitle}>EiiE</Text>
        <Text style={styles.heroSubtitle}>
          Dairy farm management made simple. Manage your sellers, customers,
          employees and expenses all in one place.
        </Text>
      </AppCard>

      {MENU_SECTIONS.map(section => (
        <View key={section.header} style={styles.section}>
          <Text style={styles.sectionHeader}>{section.header}</Text>
          <AppCard style={styles.group}>
            {section.items.map((item, index) => (
              <Pressable
                key={item.route}
                onPress={() => navigation.navigate(item.route)}
                style={({ pressed }) => [
                  styles.row,
                  index < section.items.length - 1 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowIconWrap}>
                  <Text style={styles.rowIcon}>{item.icon}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.rowChevronWrap}>
                  <Text style={styles.rowChevron}>›</Text>
                </View>
              </Pressable>
            ))}
          </AppCard>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  heroCircle1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.green700,
    opacity: 0.5,
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.green600,
    opacity: 0.35,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  group: {
    padding: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 0,
  },
  rowPressed: {
    backgroundColor: colors.primaryLight,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowIcon: {
    fontSize: fontSize.lg,
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowChevronWrap: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowChevron: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: -1,
  },
});

export default MoreMenuScreen;