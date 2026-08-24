const { addRatingRow, ratingStats } = require("./db");

function addRating({ userId, staffId, stars, comment, channelId, typeLabel, guildId }) {
  addRatingRow({
    userId,
    staffId,
    stars,
    comment,
    channelId,
    typeLabel,
    guildId
  });
}

function getStats(guildId = null) {
  return ratingStats(guildId);
}

module.exports = { addRating, getStats };
