# Notifications setup

Works out of the box: the in-app bell inbox. Browser push needs three environment variables in Vercel.

1. Generate your own keys (run once, keep the private key secret):

   node -e "const c=require('crypto');const k=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});const j=k.privateKey.export({format:'jwk'});const b=s=>Buffer.from(s,'base64url');console.log('VAPID_PUBLIC_KEY='+Buffer.concat([Buffer.from([4]),b(j.x),b(j.y)]).toString('base64url'));console.log('VAPID_PRIVATE_KEY='+j.d)"

2. Vercel > Settings > Environment Variables:
   - VAPID_PUBLIC_KEY   (the public line)
   - VAPID_PRIVATE_KEY  (the private line)
   - VAPID_SUBJECT      mailto:laichisland@gmail.com
3. Redeploy. Citizens can then press "Turn on push" in the bell panel or on the Discord notice.
