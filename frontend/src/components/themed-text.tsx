import { Text, type TextProps } from 'react-native';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
  className?: string; // Add this so we can pass Tailwind classes easily
};

const textTypeClasses = {
  default: 'text-base leading-6 font-medium',
  title: 'text-5xl font-semibold leading-[52px]',
  subtitle: 'text-[32px] leading-[44px] font-semibold',
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-bold',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-[#3c87f7]',
  code: 'font-mono text-xs font-medium', // NativeWind handles fonts safely
};

export function ThemedText({ 
  style, 
  className = '', 
  type = 'default', 
  themeColor, 
  ...rest 
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      className={`${textTypeClasses[type]} ${className}`}
      style={[
        { color: theme[themeColor ?? 'text'] }, // Keep dynamic theme color
        style, // Allow style overrides
      ]}
      {...rest}
    />
  );
}