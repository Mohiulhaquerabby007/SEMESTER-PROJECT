import db from "./dexieDb";
import api from "./api";
import { Network } from '@capacitor/network';

let isOnline = true;

const initNetwork = async () => {
  const status = await Network.getStatus();
  isOnline = status.connected;
  if (isOnline) syncPendingOrders();
  
  Network.addListener('networkStatusChange', status => {
    isOnline = status.connected;
    if (isOnline) syncPendingOrders();
  });
};

initNetwork();

export const getNetworkStatus = () => isOnline;

export const saveOrderLocally = async (orderData) => {
  const clientOrderId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const localOrder = {
    ...orderData,
    clientOrderId,
    sync_status: "pending",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await db.orders.add(localOrder);
  return localOrder;
};

export const syncPendingOrders = async () => {
  try {
    const pendingOrders = await db.orders.where("sync_status").equals("pending").toArray();

    for (const order of pendingOrders) {
      try {
        const { id, sync_status, ...payload } = order;
        const { data } = await api.post("/orders", payload);
        await db.orders.update(id, {
          sync_status: "synced",
          serverId: data._id,
          status: data.status,
          price: data.price,
        });
      } catch (err) {
        console.error("Sync failed for order:", order.clientOrderId, err);
      }
    }
  } catch (err) {
    console.error("Sync process error:", err);
  }
};

export const getLocalOrders = async () => {
  return db.orders.orderBy("createdAt").reverse().toArray();
};

export const clearSyncedOrders = async () => {
  await db.orders.where("sync_status").equals("synced").delete();
};
