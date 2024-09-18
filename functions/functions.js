module.exports = {
    formatDuration: function (ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
        const hDisplay = hours > 0 ? `${hours}h ` : "";
        const mDisplay = minutes > 0 ? `${minutes}m ` : "";
        const sDisplay = seconds > 0 ? `${seconds}s` : "";
        return hDisplay + mDisplay + sDisplay;
    }
}