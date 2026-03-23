const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

    selectFiles: async () => {
        return await ipcRenderer.invoke("selectFiles");
    },

    selectFolders: async () => {
        return await ipcRenderer.invoke("selectFolders");
    },

    encryptFiles: async (files, password) => {
        return await ipcRenderer.invoke("encryptFiles", files, password);
    },

    decryptFiles: async (files, password) => {
        return await ipcRenderer.invoke("decryptFiles", files, password);
    },

    encryptFolders: async (folders, password) => {
        return await ipcRenderer.invoke("encryptFolders", folders, password);
    },

    decryptFolders: async (folders, password) => {
        return await ipcRenderer.invoke("decryptFolders", folders, password);
    },


    onProgress: (callback) => {

        ipcRenderer.removeAllListeners("progress");

        ipcRenderer.on("progress", (_, data) => {
            callback(data);
        });

    }

});