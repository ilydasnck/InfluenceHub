import { useMemo } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { createStatCardStyles } from './styles';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: string;
}

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createStatCardStyles(isDark), [isDark]);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value}>{value}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.iconChip}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
    </View>
  );
}
