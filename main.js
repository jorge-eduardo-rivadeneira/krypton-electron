const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron");
const path = require("path");

const {
    encryptFiles,
    decryptFiles,
    encryptFolders,
    decryptFolders
} = require("./crypto/crypto");

let mainWindow;

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 680,
        height: 580,
        center: true,
        resizable: false,   
        maximizable: false, 
        icon: path.join(__dirname, "assets/icon.png"),
        title: "Krypton - File and Folder Crypto-Tool",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile("renderer/index.html");

}

function createMenu() {

    const template = [

        {
            label: "File",
            submenu: [

                { type: "separator" },
                {
                    label: "Exit",
                    role: "quit"
                }
            ]
        },

        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "selectAll" }
            ]
        },

        {
            label: "Help",
            submenu: [
                {
                    label: "About Krypton",
                    click: () => {
                        dialog.showMessageBox({
                            type: "info",
                            title: "About Krypton",
                            message: "Krypton File and Folder Crypto-Tool",
                            detail: "AES-256-GCM encryption tool \nDeveloped by Jorge Eduardo Rivadeneira Muñoz \nVersion 1.0",
                            icon: path.join(__dirname, "assets/icon.png")
                        });
                    }
                }
            ]
        }

    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

}


app.whenReady().then(() => {

    if (process.platform === "darwin") {
        app.dock.setIcon(path.join(__dirname, "assets/icon.png"));
    }

    createWindow();
    createMenu();

});

app.on("window-all-closed", () => {

    if (process.platform !== "darwin") {
        app.quit();
    }

});

app.on("activate", () => {

    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }

});


ipcMain.handle("selectFiles", async () => {

    const result = await dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"]
    });
    if (result.canceled) return null;
    return result.filePaths;

});

ipcMain.handle("selectFolders", async () => {

    const result = await dialog.showOpenDialog({
        properties: ["openDirectory","multiSelections"]
    });

    if (result.canceled) return null;

    return result.filePaths;

});

ipcMain.handle("encryptFiles", async (event, files, password) => {

    try {

        await encryptFiles(event, files, password);

        return { success: true };

    } catch (err) {

        console.error(err);

        return { success: false, error: err.message };

    }

});

ipcMain.handle("decryptFiles", async (event, files, password) => {

    try {

        await decryptFiles(event, files, password);

        return { success: true };

    } catch (err) {

        console.error(err);

        return { success: false, error: err.message };

    }

});

ipcMain.handle("encryptFolders", async (event, folders, password) => {
    try {
        await encryptFolders(event, folders, password);
        return { success: true };
    } catch (err) {

        console.error(err);

        return { success: false, error: err.message };

    }

});

ipcMain.handle("decryptFolders", async (event, folders, password) => {
        try {
        await decryptFolders(event, folders, password);
        return { success: true };
    } catch (err) {

        console.error(err);

        return { success: false, error: err.message };

    }

});