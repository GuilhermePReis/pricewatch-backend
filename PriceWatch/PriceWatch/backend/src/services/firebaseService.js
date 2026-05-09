const admin = require('firebase-admin');

let initialized = false;

function initFirebase() {
  if (initialized || admin.apps.length > 0) return;
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('⚠️ Firebase não configurado — push desativado');
    return;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    initialized = true;
    console.log('🔥 Firebase inicializado');
  } catch (err) {
    console.warn('⚠️ Firebase erro:', err.message);
  }
}

async function sendPush(fcmToken, { title, body, data = {} }) {
  if (!initialized || !fcmToken) return false;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k,v]) => [k, String(v)])),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    return true;
  } catch (err) {
    console.error('[FCM] Erro:', err.message);
    return false;
  }
}

module.exports = { initFirebase, sendPush };