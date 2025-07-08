// src/onesignal-setup.js
export function setupOneSignal() {
  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(function () {
    window.OneSignal.init({
      appId: "f08cbf9d-22b2-4537-a281-ade95d4585a8", 
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });
  });
}



