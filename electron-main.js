const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, Menu, shell, ipcMain, safeStorage } = require("electron");

let mainWindow = null;
let splashWindow = null;
let applicationStarted = false;

function sendDesktopEvent(type, payload = {}) {
  [splashWindow, mainWindow].forEach(window => {
    if (!window || window.isDestroyed()) return;
    window.webContents.send("allstar:desktop-event", { type, payload });
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 520,
    height: 280,
    resizable: false,
    maximizable: false,
    minimizable: false,
    frame: false,
    transparent: false,
    backgroundColor: "#11121b",
    icon: path.join(__dirname, "assets", "branding", "allstars_icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "electron-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  splashWindow.loadFile(path.join(__dirname, "update.html"));
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

function startApplication() {
  if (applicationStarted) return;
  applicationStarted = true;
  createMainWindow();
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
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

function rememberedCredentialsPath() {
  return path.join(app.getPath("userData"), "remembered-credentials.json");
}

ipcMain.handle("allstar:get-remembered-credentials", () => {
  try {
    if (!safeStorage.isEncryptionAvailable()) return { remember: false };
    const saved = JSON.parse(fs.readFileSync(rememberedCredentialsPath(), "utf8"));
    const decrypted = safeStorage.decryptString(Buffer.from(saved.data, "base64"));
    const credentials = JSON.parse(decrypted);
    return {
      remember: Boolean(credentials.remember),
      email: String(credentials.email || ""),
      password: String(credentials.password || "")
    };
  } catch {
    return { remember: false };
  }
});

ipcMain.handle("allstar:set-remembered-credentials", (_event, credentials = {}) => {
  const filePath = rememberedCredentialsPath();
  try {
    if (!credentials.remember) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return true;
    }
    if (!safeStorage.isEncryptionAvailable()) return false;
    const payload = JSON.stringify({
      remember: true,
      email: String(credentials.email || "").trim().slice(0, 254),
      password: String(credentials.password || "").slice(0, 512)
    });
    const encrypted = safeStorage.encryptString(payload).toString("base64");
    fs.writeFileSync(filePath, JSON.stringify({ data: encrypted }), "utf8");
    return true;
  } catch {
    return false;
  }
});

function setupAutoUpdater() {
  if (!app.isPackaged) {
    sendDesktopEvent("update-not-available");
    setTimeout(startApplication, 650);
    return;
  }

  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch (error) {
    sendDesktopEvent("update-error", { message: "electron-updater n'est pas installe." });
    setTimeout(startApplication, 1000);
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  let installingUpdate = false;

  autoUpdater.on("checking-for-update", () => sendDesktopEvent("update-checking"));
  autoUpdater.on("update-available", info => sendDesktopEvent("update-available", info));
  autoUpdater.on("update-not-available", info => {
    sendDesktopEvent("update-not-available", info);
    setTimeout(startApplication, 650);
  });
  autoUpdater.on("download-progress", progress => sendDesktopEvent("update-progress", progress));
  autoUpdater.on("update-downloaded", info => {
    sendDesktopEvent("update-downloaded", info);
    if (installingUpdate) return;
    installingUpdate = true;
    setTimeout(() => autoUpdater.quitAndInstall(true, true), 900);
  });
  autoUpdater.on("error", error => {
    sendDesktopEvent("update-error", {
      message: error && error.message ? error.message : String(error)
    });
    setTimeout(startApplication, 1000);
  });

  autoUpdater.checkForUpdates().catch(error => {
    sendDesktopEvent("update-error", {
      message: error && error.message ? error.message : String(error)
    });
    setTimeout(startApplication, 1000);
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  splashWindow.webContents.once("did-finish-load", setupAutoUpdater);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      applicationStarted = false;
      createSplashWindow();
      splashWindow.webContents.once("did-finish-load", setupAutoUpdater);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
