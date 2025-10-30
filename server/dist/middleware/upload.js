"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarUpload = exports.userAvatarUpload = exports.athleteAvatarUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const baseUploadsDir = path_1.default.join(__dirname, '../../uploads');
const ensureDir = (subDir) => {
    const dir = path_1.default.join(baseUploadsDir, subDir);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    return dir;
};
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB
const makeStorage = (subDir) => multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, ensureDir(subDir));
    },
    filename: function (req, file, cb) {
        const id = req.params.id || subDir.slice(0, -1);
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
        const filename = `${id}-${Date.now()}${safeExt}`;
        cb(null, filename);
    },
});
const buildUploader = (subDir) => (0, multer_1.default)({
    storage: makeStorage(subDir),
    limits,
    fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Invalid file type'));
    },
});
exports.athleteAvatarUpload = buildUploader('athletes');
exports.userAvatarUpload = buildUploader('users');
// Backwards compatibility for existing imports
exports.avatarUpload = exports.athleteAvatarUpload;
