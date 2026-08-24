const QRCode = require("qrcode");

/**
 * Gera buffer de QR a partir do texto (payload Pix / chave).
 * Mantém formato compatível com discord.js files.
 */
module.exports = async function makeQr(texto) {
  const buffer = await QRCode.toBuffer(String(texto), {
    type: "png",
    width: 512,
    margin: 2
  });
  return { attachment: buffer, name: "pix-qr.png" };
};
