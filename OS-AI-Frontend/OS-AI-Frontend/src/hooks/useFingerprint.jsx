import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function useFingerprint() {
  const [fp, setFp] = useState(null);
  useEffect(() => {
    FingerprintJS.load().then(fp => fp.get()).then(result => setFp(result.visitorId));
  }, []);
  return fp;
}
