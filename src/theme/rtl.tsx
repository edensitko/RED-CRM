import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

interface RTLProps {
  children: React.ReactNode;
}

export function RTL(props: RTLProps) {
  return <CacheProvider value={cacheRtl}>{props.children}</CacheProvider>;
}
