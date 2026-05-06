import { io } from "socket.io-client";

// Connect to the backend server
const socket = io("http://localhost:5005", {
  autoConnect: true,
  reconnection: true,
});

export default socket;
