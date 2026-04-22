const certificationService = require("../services/certificationService");
const asyncHandler = require("../middleware/asyncHandler");

// Apply for certification
exports.apply = asyncHandler(async (req, res) => {
  const request = await certificationService.apply(req.body);
  res.status(201).json({ message: "Certification application submitted successfully.", request });
});

// Get all certification requests
exports.getAllRequests = asyncHandler(async (req, res) => {
  const requests = await certificationService.getAllRequests();
  res.status(200).json({ requests });
});

// Approve certification
exports.approve = asyncHandler(async (req, res) => {
  const request = await certificationService.approve(req.params.certificationRequestId, req.body.adminNotes);
  res.status(200).json({ message: "Certification approved successfully.", request });
});


// Reject certification
exports.reject = asyncHandler(async (req, res) => {
  const request = await certificationService.reject(req.params.certificationRequestId, req.body.adminNotes);
  res.status(200).json({ message: "Certification rejected successfully.", request });
});

// Get certification by ID
exports.getCertificationById = asyncHandler(async (req, res) => {
  const request = await certificationService.getCertificationRequestById(req.params.certificationId);
  res.status(200).json({ request });
});