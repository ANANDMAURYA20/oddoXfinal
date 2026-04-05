const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const kdsService = require("./kds.service");

const createStation = asyncHandler(async (req, res) => {
  const station = await kdsService.createStation(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, station, "KDS station created"));
});

const listStations = asyncHandler(async (req, res) => {
  const stations = await kdsService.listStations(req.tenantId);
  res.status(200).json(new ApiResponse(200, stations, "KDS stations fetched"));
});

const getStationById = asyncHandler(async (req, res) => {
  const station = await kdsService.getStationById(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, station, "KDS station fetched"));
});

const updateStation = asyncHandler(async (req, res) => {
  const station = await kdsService.updateStation(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, station, "KDS station updated"));
});

const deleteStation = asyncHandler(async (req, res) => {
  await kdsService.deleteStation(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "KDS station deleted"));
});

module.exports = { createStation, listStations, getStationById, updateStation, deleteStation };
