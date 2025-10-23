"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const baseUploadsDir = path_1.default.join(__dirname, '../../uploads');
const athletesDir = path_1.default.join(baseUploadsDir, 'athletes');
if (!fs_1.default.existsSync(athletesDir)) {
    fs_1.default.mkdirSync(athletesDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, athletesDir);
    },
    filename: function (req, file, cb) {
        const id = req.params.id || 'athlete';
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
        const filename = `${id}-${Date.now()}${safeExt}`;
        cb(null, filename);
    }
});
exports.avatarUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Invalid file type'));
    }
});
