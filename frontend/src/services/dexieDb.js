import Dexie from "dexie";

const db = new Dexie("QuickDropDB");

db.version(1).stores({
  orders: "++id, clientOrderId, sync_status, status, createdAt",
  pendingActions: "++id, type, payload, createdAt",
});

export default db;
