const crypto = require("crypto");
const { createHmac } = require("node:crypto");

const algorithm = "aes-192-cbc";
const password = "2001MyForever";
const salt = "salt";
const keysize = 24;
const iv = Buffer.alloc(16, 0);

const encryptData = async (data, password) => {
  let encrypted = "";
  let retval;
  await crypto.scrypt(password, salt, keysize, async (err, key) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    cipher.setEncoding("hex");

    cipher.on("data", (chunk) => (encrypted += chunk));
    cipher.on("end", () => console.log("encrypting...")); // Prints encrypted data with key

    cipher.write(data);
    cipher.end();
    retval = encrypted;
  });
  return retval;
};

const decryptData = async (encrypted, password) => {
  let decrypted = "";
  let retval = "";
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keysize, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.on("readable", (chunk) => {
    while (null !== (chunk = decipher.read())) {
      decrypted += chunk.toString("utf8");
    }
  });
  decipher.on("end", () => {
    console.log("decrypting...");
    retval = decrypted;
  });
  decipher.write(encrypted, "hex");
  decipher.end();

  await new Promise((resolve) => {
    decipher.on("end", () => {
      resolve();
    });
  });

  console.log(decrypted ? decrypted : "Return failed");
  return retval;
};

// let data = "The quick brown fox jumps over the lazy dog.";
// let encryptedData = await encryptData(data, password);
// console.log("Encrypted: ", encryptedData);
// let decryptedData = await decryptData(encryptedData, password);
// console.log("Decrypted: ", decryptedData);

// We will first generate the key, as it is dependent on the algorithm.
// In this case for aes192, the key is 24 bytes (192 bits).
// crypto.scrypt(password, salt, keysize, (err, key) => {
//   if (err) throw err;
//   // After that, we will generate a random iv (initialization vector)
//   crypto.randomFill(new Uint8Array(16), (err, iv) => {
//     if (err) throw err;

//     // Create Cipher with key and iv
//     const cipher = crypto.createCipheriv(algorithm, key, iv);

//     let encrypted = "";
//     cipher.setEncoding("hex");

//     cipher.on("data", (chunk) => (encrypted += chunk));
//     cipher.on("end", () => console.log(encrypted)); // Prints encrypted data with key

//     cipher.write("The quick brown fox jumps over the lazy dog.");
//     cipher.end();

//     const decipher = crypto.createDecipheriv(algorithm, key, iv);

//     let decrypted = "";
//     decipher.on("readable", () => {
//       while (null !== (chunk = decipher.read())) {
//         decrypted += chunk.toString("utf8");
//       }
//     });
//     decipher.on("end", () => {
//       console.log(decrypted);
//       // Prints: some clear text data
//     });

//     // Encrypted with same algorithm, key and iv.
//     decipher.write(encrypted, "hex");
//     decipher.end();
//   });
// });

module.exports = { encryptData, decryptData };
