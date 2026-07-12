const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("AllstarDesktop", {
  isElectron: true,
  platform: process.platform,
  onDesktopEvent(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, message) => callback(message);
    ipcRenderer.on("allstar:desktop-event", listener);
    return () => ipcRenderer.removeListener("allstar:desktop-event", listener);
  },
  setFullscreen(enabled) {
    return ipcRenderer.invoke("allstar:set-fullscreen", Boolean(enabled));
  },
  setResolution(width, height) {
    return ipcRenderer.invoke("allstar:set-resolution", { width, height });
  },
  quitApp() {
    return ipcRenderer.invoke("allstar:quit-app");
  },
  getAppVersion() {
    return ipcRenderer.invoke("allstar:get-app-version");
  }
});
