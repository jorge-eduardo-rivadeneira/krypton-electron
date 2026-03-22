const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

    /* ==========================
       Selección de archivos
    ========================== */

    selectFiles: async () => {
        return await ipcRenderer.invoke("selectFiles");
    },


    /* ==========================
       Selección de carpeta
    ========================== */

    selectFolder: async () => {
        return await ipcRenderer.invoke("selectFolder");
    },


    /* ==========================
       Cifrar archivos
    ========================== */

    encryptFiles: async (files, password) => {
        return await ipcRenderer.invoke("encryptFiles", files, password);
    },


    /* ==========================
       Descifrar archivos
    ========================== */

    decryptFiles: async (files, password) => {
        return await ipcRenderer.invoke("decryptFiles", files, password);
    },


    /* ==========================
       Cifrar carpeta
    ========================== */

    encryptFolder: async (folder, password) => {
        return await ipcRenderer.invoke("encryptFolder", folder, password);
    },


    /* ==========================
       Descifrar carpeta
    ========================== */

    decryptFolder: async (folder, password) => {
        return await ipcRenderer.invoke("decryptFolder", folder, password);
    },


    /* ==========================
       Progreso
    ========================== */

    onProgress: (callback) => {

        ipcRenderer.removeAllListeners("progress");

        ipcRenderer.on("progress", (_, data) => {
            callback(data);
        });

    }

});