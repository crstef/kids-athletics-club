"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProbe = exports.updateProbe = exports.createProbe = exports.getAllProbes = void 0;
var eventsController_1 = require("./eventsController");
Object.defineProperty(exports, "getAllProbes", { enumerable: true, get: function () { return eventsController_1.getAllEvents; } });
Object.defineProperty(exports, "createProbe", { enumerable: true, get: function () { return eventsController_1.createEvent; } });
Object.defineProperty(exports, "updateProbe", { enumerable: true, get: function () { return eventsController_1.updateEvent; } });
Object.defineProperty(exports, "deleteProbe", { enumerable: true, get: function () { return eventsController_1.deleteEvent; } });
