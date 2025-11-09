import { toRelativeHref } from '../utils/url-utils.js';

/**
 * Navigation component generation
 */

export function generateNavigationComponent(navigation: Array<{ url: string; text: string }>): string {
  const navItems = navigation.map(item => `<NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <a href="${toRelativeHref(item.url)}">${item.text}</a>
          </NavigationMenuLink>
        </NavigationMenuItem>`).join('\n        ');

  return `'use client';

import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

export default function Navigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        ${navItems}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
`;
}
