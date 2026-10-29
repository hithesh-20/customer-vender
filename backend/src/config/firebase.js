const config = require('./config');
const logger = require('../utils/logger');

let admin = null;
let firebaseInitialized = false;

if (config.firebase.enabled) {
  try {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
        }),
        storageBucket: config.firebase.storageBucket,
      });
    }
    firebaseInitialized = true;
    logger.info('✅ Firebase Admin SDK initialized');
  } catch (error) {
    logger.warn(`⚠️ Firebase Admin not initialized (${error.message}); using local auth & notification mode`);
  }
} else {
  logger.info('ℹ️ Firebase credentials not set; running with built-in JWT + OTP + Socket.io notifications');
}

async function verifyFirebaseToken(idToken) {
  if (!firebaseInitialized || !admin) {
    return { success: false, error: 'Firebase not configured' };
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      uid: decoded.uid,
      email: decoded.email,
      phone: decoded.phone_number,
      token: decoded,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendFirebaseNotification(notificationData) {
  if (!firebaseInitialized || !admin) {
    return { success: false, error: 'Firebase FCM credentials are not configured' };
  }
  try {
    const message = {
      notification: {
        title: notificationData.title,
        body: notificationData.body,
      },
      data: notificationData.data || {},
    };
    if (notificationData.token) message.token = notificationData.token;
    if (notificationData.topic) message.topic = notificationData.topic;
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  isEnabled: () => firebaseInitialized,
  verifyFirebaseToken,
  sendFirebaseNotification,
};
