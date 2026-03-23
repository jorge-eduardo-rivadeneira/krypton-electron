const btnSelectFiles = document.getElementById("btnSelectFiles");
const btnSelectFolders = document.getElementById("btnSelectFolders");
const lblPath = document.getElementById("lblPath");
const btnStart = document.getElementById("btnStart");
const txtPassword = document.getElementById("txtPassword");
const chkShowPassword = document.getElementById("chkShowPassword");

const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const progressSpeed = document.getElementById("progressSpeed");
const progressTime = document.getElementById("progressTime");

const radioEncrypt = document.getElementById("encryptRDB");
const radioDecrypt = document.getElementById("decryptRDB");
const logo = document.getElementById("logo");


let selectedFolders = [];
let selectedFiles = [];
let darkMode = true;

function resetUI() {

    txtPassword.value = "";

    selectedFolders = [];
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
        selectedFolders = [];
        lblPath.innerText = files.join("\n");
    }

});

btnSelectFolders.addEventListener("click", async () => {

    const folders = await window.api.selectFolders();
    
    if (folders && folders.length > 0) {
        selectedFolders = folders;
        selectedFiles = [];
        lblPath.innerText = folders.join("\n");
    }

});

btnStart.addEventListener("click", async () => {

    const password = txtPassword.value.trim();

    if (!password) {
        alert("Please enter a password");
        return;
    }

    if (selectedFolders.length === 0 && selectedFiles.length === 0) {
        alert("Please select a folder or files");
        return;
    }

    btnStart.disabled = true;
    progressBar.value = 0;
    progressPercent.innerText = "0%";
    progressSpeed.innerText = "0 MB/s";
    progressTime.innerText = "--:--";

    try {
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

        else {

            if (radioEncrypt.checked) {

                const result = await window.api.encryptFolders(selectedFolders, password);

                if (!result.success)
                    throw new Error(result.error);

                alert("Encryption completed successfully!");

            } else {

                const result = await window.api.decryptFolders(selectedFolders, password);

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

chkShowPassword.addEventListener("change", () => {
    txtPassword.type = chkShowPassword.checked ? "text" : "password";
 
});





