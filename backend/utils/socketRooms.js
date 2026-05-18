function getRouteRoomName(route, travelDate) {
  if (!route || !travelDate) return null;
  const dateKey = new Date(travelDate).toISOString().slice(0, 10);
  const cleanedRoute = route.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `route:${cleanedRoute}:${dateKey}`;
}

module.exports = { getRouteRoomName };
