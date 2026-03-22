const btnSelectFiles = document.getElementById("btnSelectFiles");
const btnSelectFolder = document.getElementById("btnSelectFolder");
const lblPath = document.getElementById("lblPath");
const btnStart = document.getElementById("btnStart");
const txtPassword = document.getElementById("txtPassword");

const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const progressSpeed = document.getElementById("progressSpeed");
const progressTime = document.getElementById("progressTime");

const radioEncrypt = document.getElementById("encryptRDB");
const radioDecrypt = document.getElementById("decryptRDB");
const btnToggleMode = document.getElementById("btnToggleMode");
const logo = document.getElementById("logo");


let selectedFolder = null;
let selectedFiles = [];
let darkMode = true;

function resetUI() {

    txtPassword.value = "";

    selectedFolder = null;
    selectedFiles = [];

    lblPath.innerText = "";

    progressBar.value = 0;
    progressPercent.innerText = "0%";
    progressSpeed.innerText = "0 MB/s";
    progressTime.innerText = "--:--";
}

btnSelectFiles.addEventListener("click", async () => {

    const files = await window.api.selectFiles();

    if (files && files.length > 0) {
        selectedFiles = files;
        selectedFolder = null;
        lblPath.innerText = files.join("\n");
    }

});

btnSelectFolder.addEventListener("click", async () => {

    const folder = await window.api.selectFolder();

    if (folder) {
        selectedFolder = folder;
        selectedFiles = [];
        lblPath.innerText = folder;
    }

});

btnStart.addEventListener("click", async () => {

    const password = txtPassword.value.trim();

    if (!password) {
        alert("Please enter a password");
        return;
    }

    if (!selectedFolder && selectedFiles.length === 0) {
        alert("Please select a folder or files");
        return;
    }

    btnStart.disabled = true;

    progressBar.value = 0;
    progressPercent.innerText = "0%";
    progressSpeed.innerText = "0 MB/s";
    progressTime.innerText = "--:--";

    try {

        // ARCHIVOS INDIVIDUALES
        if (selectedFiles.length > 0) {

            if (radioEncrypt.checked) {

                const result = await window.api.encryptFiles(selectedFiles, password);

                if (!result.success)
                    throw new Error(result.error);

                alert("Encryption completed successfully!");

            } else {

                const result = await window.api.decryptFiles(selectedFiles, password);

                if (!result.success)
                    throw new Error(result.error);

                alert("Decryption completed successfully!");
            }

        }

        // CARPETA
        else {

            if (radioEncrypt.checked) {

                const result = await window.api.encryptFolder(selectedFolder, password);

                if (!result.success)
                    throw new Error(result.error);

                alert("Encryption completed successfully!");

            } else {

                const result = await window.api.decryptFolder(selectedFolder, password);

                if (!result.success)
                    throw new Error(result.error);

                alert("Decryption completed successfully!");
            }

        }

        resetUI();

    } catch (err) {

        alert("Error: " + err.message);

        progressBar.value = 0;
        progressPercent.innerText = "0%";
        progressSpeed.innerText = "0 MB/s";
        progressTime.innerText = "--:--";

    } finally {

        btnStart.disabled = false;

    }

});

window.api.onProgress((data) => {

    progressBar.value = data.percent;
    progressPercent.innerText = data.percent + "%";
    progressSpeed.innerText = data.speed + " MB/s";
    progressTime.innerText = data.remaining;

});

radioEncrypt.addEventListener("change", () => {

    btnStart.innerText = "Encrypt";

});

radioDecrypt.addEventListener("change", () => {

    btnStart.innerText = "Decrypt";

});

btnToggleMode.addEventListener("click", () => {

    
    if (darkMode) {
        // Modo claro
        document.documentElement.style.setProperty('--bg-color', '#f5f5f5');
        document.documentElement.style.setProperty('--container-bg', '#ffffff');
        document.documentElement.style.setProperty('--text-color', '#1e1e1e'); // texto oscuro
        document.documentElement.style.setProperty('--input-bg', '#ffffff');
        document.documentElement.style.setProperty('--input-border', '#ccc');
        document.documentElement.style.setProperty('--primary-color', '#3c3c3c');
        document.documentElement.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #3c3c3c, #3c3c3c)');
        logo.src = "./../assets/logo2.png";
        btnToggleMode.textContent="🌙"
        

    } else {
        // Modo oscuro
        document.documentElement.style.setProperty('--bg-color', '#121212');
        document.documentElement.style.setProperty('--container-bg', '#3c3c3c');
        document.documentElement.style.setProperty('--text-color', '#e0e0e0'); // texto claro
        document.documentElement.style.setProperty('--input-bg', '#2a2a2a');
        document.documentElement.style.setProperty('--input-border', '#444444df');
        document.documentElement.style.setProperty('--primary-color', '#121212');
        document.documentElement.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #121212, #121212)');
        logo.src = "./../assets/logo.png";
        btnToggleMode.textContent="☀️"
    }
    darkMode = !darkMode;
});

