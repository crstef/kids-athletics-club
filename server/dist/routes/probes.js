"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const probesController_1 = require("../controllers/probesController");
const auth_1 = require("../middleware/auth");
const authorizeDb_1 = __importDefault(require("../middleware/authorizeDb"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, authorizeDb_1.default)('probes.view'), probesController_1.getAllProbes);
router.post('/', (0, authorizeDb_1.default)('probes.create'), probesController_1.createProbe);
router.put('/:id', (0, authorizeDb_1.default)('probes.edit'), probesController_1.updateProbe);
router.delete('/:id', (0, authorizeDb_1.default)('probes.delete'), probesController_1.deleteProbe);
exports.default = router;
