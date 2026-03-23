const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getFiles(dir) {

    let results = [];

    const list = fs.readdirSync(dir);

    list.forEach(file => {

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else {
            results.push(fullPath);
        }

    });

    return results;
}

function deriveKey(password, salt) {

    return crypto.pbkdf2Sync(
        password,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        "sha256"
    );

}

function encryptFile(file, password, progressCallback) {

    return new Promise((resolve, reject) => {

        if (file.endsWith(".enc")) return resolve();

        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        const key = deriveKey(password, salt);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const input = fs.createReadStream(file);
        const outputFile = file + ".enc";
        const output = fs.createWriteStream(outputFile);

        output.write(salt);
        output.write(iv);

        input.on("data", chunk => {

            if (progressCallback)
                progressCallback(chunk.length);

        });

        input.pipe(cipher).pipe(output);

        output.on("finish", () => {

            try {

                const tag = cipher.getAuthTag();

                fs.appendFileSync(outputFile, tag);

                fs.unlinkSync(file);

                resolve();

            } catch (err) {

                reject(err);

            }

        });

        input.on("error", reject);
        output.on("error", reject);

    });

}


function decryptFile(file, password, progressCallback) {

    return new Promise((resolve, reject) => {

        const fd = fs.openSync(file, "r");

        const salt = Buffer.alloc(SALT_LENGTH);
        const iv = Buffer.alloc(IV_LENGTH);

        fs.readSync(fd, salt, 0, SALT_LENGTH, 0);
        fs.readSync(fd, iv, 0, IV_LENGTH, SALT_LENGTH);

        const stat = fs.statSync(file);

        const tagPosition = stat.size - TAG_LENGTH;

        const tag = Buffer.alloc(TAG_LENGTH);

        fs.readSync(fd, tag, 0, TAG_LENGTH, tagPosition);

        fs.closeSync(fd);

        const key = deriveKey(password, salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        decipher.setAuthTag(tag);

        const input = fs.createReadStream(file, {
            start: SALT_LENGTH + IV_LENGTH,
            end: tagPosition - 1
        });

        const outputFile = file.replace(".enc", "");
        const output = fs.createWriteStream(outputFile);

        input.on("data", chunk => {

            if (progressCallback)
                progressCallback(chunk.length);

        });

        decipher.on("error", () => {

            output.destroy();

            if (fs.existsSync(outputFile))
                fs.unlinkSync(outputFile);

            reject(new Error("Contraseña incorrecta o archivo corrupto"));

        });

        output.on("finish", () => {

            fs.unlinkSync(file);

            resolve();

        });

        input.on("error", reject);
        output.on("error", reject);

        input.pipe(decipher).pipe(output);

    });

}

function formatTime(seconds) {

    seconds = Math.max(0, Math.round(seconds));

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;

}

async function encryptFiles(event, files, password){

    const totalBytes = files.reduce((sum,file)=>{
        return sum + fs.statSync(file).size;
    },0);

    let processedBytes = 0;
    const startTime = Date.now();

    for(const file of files){

        await encryptFile(file,password,(bytes)=>{

            processedBytes += bytes;

            const percent = Math.round((processedBytes/totalBytes)*100);

            const elapsed = (Date.now()-startTime)/1000;

            const speed = (processedBytes/1024/1024)/elapsed;

            const remaining =
                (totalBytes-processedBytes) /
                (processedBytes/elapsed);

            event.sender.send("progress",{
                percent,
                speed:speed.toFixed(2),
                remaining:formatTime(remaining)
            });

        });

    }

    return { success:true };

}

async function decryptFiles(event, files, password){

    const totalBytes = files.reduce((sum,file)=>{
        return sum + fs.statSync(file).size;
    },0);

    let processedBytes = 0;
    const startTime = Date.now();

    for(const file of files){

    try {

        await decryptFile(file,password,(bytes)=>{

            processedBytes += bytes;

            const percent = Math.round((processedBytes/totalBytes)*100);

            const elapsed = (Date.now()-startTime)/1000;

            const speed = (processedBytes/1024/1024)/elapsed;

            const remaining =
                (totalBytes-processedBytes) /
                (processedBytes/elapsed);

            event.sender.send("progress",{
                percent,
                speed:speed.toFixed(2),
                remaining:formatTime(remaining)
            });

        });

        } catch (err) {

            if (err.message.includes("Contraseña incorrecta")) {

                throw new Error(`Archivo ${path.basename(file)}: contraseña incorrecta`);

            } else {

                throw err;

            }

        }

    }

}

async function encryptFolders(event, folders, password) {

    let allFiles = [];

    for (const folder of folders) {
        const files = getFiles(folder).filter(f => !f.endsWith(".enc"));
        allFiles = allFiles.concat(files);
    }

    if (allFiles.length === 0) return;

    const totalBytes = allFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);

    let processedBytes = 0;
    const startTime = Date.now();

    for (const file of allFiles) {

        await encryptFile(file, password, (bytes) => {

            processedBytes += bytes;

            const percent = Math.round((processedBytes / totalBytes) * 100);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = (processedBytes / 1024 / 1024) / elapsed;

            const remaining =
                (totalBytes - processedBytes) /
                (processedBytes / elapsed);

            event.sender.send("progress", {
                percent,
                speed: speed.toFixed(2),
                remaining: formatTime(remaining)
            });

        });

    }

    return { success: true };
}

async function decryptFolders(event, folders, password) {

    let allFiles = [];

    for (const folder of folders) {
        const files = getFiles(folder).filter(f => f.endsWith(".enc"));
        allFiles = allFiles.concat(files);
    }

    if (allFiles.length === 0) return;

    const totalBytes = allFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);

    let processedBytes = 0;
    const startTime = Date.now();

    for (const file of allFiles) {

        try {

            await decryptFile(file, password, (bytes) => {

                processedBytes += bytes;

                const percent = Math.round((processedBytes / totalBytes) * 100);
                const elapsed = (Date.now() - startTime) / 1000;
                const speed = (processedBytes / 1024 / 1024) / elapsed;

                const remaining =
                    (totalBytes - processedBytes) /
                    (processedBytes / elapsed);

                event.sender.send("progress", {
                    percent,
                    speed: speed.toFixed(2),
                    remaining: formatTime(remaining)
                });

            });

        } catch (err) {

            if (err.message.includes("Contraseña incorrecta")) {
                throw new Error(`Archivo ${path.basename(file)}: contraseña incorrecta`);
            } else {
                throw err;
            }

        }

    }

    return { success: true };
}



module.exports = {
    encryptFiles,
    decryptFiles,
    encryptFolders,    
    decryptFolders  
};