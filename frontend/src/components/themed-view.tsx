import { View, type ViewProps } from 'react-native';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
  className?: string; // Ensure we support NativeWind
};

export function ThemedView({ 
  style, 
  className = '', 
  lightColor, 
  darkColor, 
  type, 
  ...otherProps 
}: ThemedViewProps) {
  const theme = useTheme();

  return (
    <View 
      className={className} 
      style={[{ backgroundColor: theme[type ?? 'background'] }, style]} 
      {...otherProps} 
    />
  );
}