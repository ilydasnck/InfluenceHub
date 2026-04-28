import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { dashboardStrings } from '../../assets/Constants/dashboardStrings';
import { createAppDrawerStyles } from './styles';

export interface DrawerItem {
  key: string;
  label: string;
  icon: string;
}

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
  items: DrawerItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  email: string | null;
}

export default function AppDrawer({
  visible,
  onClose,
  items,
  activeKey,
  onSelect,
  email,
}: AppDrawerProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createAppDrawerStyles(isDark), [isDark]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-320, 0],
  });

  const initial = (email ?? '?').charAt(0).toUpperCase();
  const userName = email ? email.split('@')[0] : 'user';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlayWrap}>
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Text style={styles.brand}>InfluenceHub</Text>
            <Text style={styles.tagline}>İçerik Yöneticisi</Text>
          </View>

          <View style={styles.nav}>
            {items.map(item => {
              const active = item.key === activeKey;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => onSelect(item.key)}
                  style={[styles.navItem, active && styles.navItemActive]}>
                  <Text
                    style={[styles.navIcon, active && styles.navIconActive]}>
                    {item.icon}
                  </Text>
                  <Text
                    style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <View style={styles.userBox}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName}
                </Text>
                <Text style={styles.userRole}>{dashboardStrings.role}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Pressable
          style={styles.overlayTouch}
          onPress={onClose}
          accessibilityLabel={dashboardStrings.closeMenu}
        />
      </View>
    </Modal>
  );
}
