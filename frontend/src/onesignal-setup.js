// src/onesignal-setup.js
export function setupOneSignal() {
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(function () {
    OneSignal.init({
      appId: "f08cbf9d-22b2-4537-a281-ade95d4585a8", // replace this
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });
  });
}
