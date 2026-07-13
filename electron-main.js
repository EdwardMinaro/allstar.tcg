const path = require("path");
const { app, BrowserWindow, Menu, shell, ipcMain } = require("electron");

let mainWindow = null;

function sendDesktopEvent(type, payload = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("allstar:desktop-event", { type, payload });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    fullscreen: true,
    backgroundColor: "#11121b",
    icon: path.join(__dirname, "assets", "branding", "allstars_icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "electron-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.webContents.once("did-finish-load", setupAutoUpdater);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

ipcMain.handle("allstar:set-fullscreen", (_event, enabled) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  mainWindow.setFullScreen(Boolean(enabled));
  return mainWindow.isFullScreen();
});

ipcMain.handle("allstar:set-resolution", (_event, size = {}) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  const width = Number(size.width);
  const height = Number(size.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  mainWindow.setFullScreen(false);
  mainWindow.setSize(Math.max(1280, Math.round(width)), Math.max(720, Math.round(height)));
  mainWindow.center();
  return true;
});

ipcMain.handle("allstar:quit-app", () => {
  app.quit();
  return true;
});

ipcMain.handle("allstar:get-app-version", () => app.getVersion());

function setupAutoUpdater() {
  if (!app.isPackaged) {
    return;
  }

  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch (error) {
    sendDesktopEvent("update-unavailable", {
      message: "electron-updater n'est pas installe."
    });
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  let installingUpdate = false;

  autoUpdater.on("checking-for-update", () => {
    sendDesktopEvent("update-checking");
  });

  autoUpdater.on("update-available", (info) => {
    sendDesktopEvent("update-available", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    sendDesktopEvent("update-not-available", info);
  });

  autoUpdater.on("download-progress", (progress) => {
    sendDesktopEvent("update-progress", progress);
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendDesktopEvent("update-downloaded", info);
    if (installingUpdate) return;
    installingUpdate = true;
    setTimeout(() => autoUpdater.quitAndInstall(true, true), 1200);
  });

  autoUpdater.on("error", (error) => {
    sendDesktopEvent("update-error", {
      message: error && error.message ? error.message : String(error)
    });
  });

  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    sendDesktopEvent("update-error", {
      message: error && error.message ? error.message : String(error)
    });
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
